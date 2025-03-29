const axios = require("axios");
const { mockDB } = require("./database");
require("dotenv").config();





// Stores past queries & their SQL results
let queryHistory = [
    { naturalQuery: "show all sales", sqlQuery: "SELECT * FROM sales" },
    { naturalQuery: "total revenue", sqlQuery: "SELECT SUM(amount) FROM sales" },
    { naturalQuery: "average price", sqlQuery: "SELECT AVG(price) FROM products" },
    { naturalQuery: "count customers", sqlQuery: "SELECT COUNT(*) FROM customers" },
    { naturalQuery: "last month sales", sqlQuery: "SELECT * FROM sales WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)" },
    { naturalQuery: "highest sale", sqlQuery: "SELECT MAX(amount) FROM sales" },
    { naturalQuery: "lowest sale", sqlQuery: "SELECT MIN(amount) FROM sales" },
    { naturalQuery: "total products", sqlQuery: "SELECT COUNT(*) FROM products" },
    { naturalQuery: "total orders", sqlQuery: "SELECT COUNT(*) FROM orders" },
    { naturalQuery: "orders this month", sqlQuery: "SELECT * FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)" },
    { naturalQuery: "employee count", sqlQuery: "SELECT COUNT(*) FROM employees" },
    { naturalQuery: "highest salary", sqlQuery: "SELECT MAX(salary) FROM employees" },
    { naturalQuery: "lowest salary", sqlQuery: "SELECT MIN(salary) FROM employees" },
    { naturalQuery: "total budget", sqlQuery: "SELECT SUM(budget) FROM departments" },
    { naturalQuery: "departments list", sqlQuery: "SELECT * FROM departments" },
    { naturalQuery: "product categories", sqlQuery: "SELECT DISTINCT category FROM products" },
    { naturalQuery: "sales per product", sqlQuery: "SELECT product_id, SUM(quantity) FROM orders GROUP BY product_id" },
    { naturalQuery: "sales per customer", sqlQuery: "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id" },
    { naturalQuery: "top selling product", sqlQuery: "SELECT product_id, SUM(quantity) FROM orders GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 1" },
    { naturalQuery: "highest earning product", sqlQuery: "SELECT product_id, SUM(quantity * price) AS revenue FROM orders JOIN products ON orders.product_id = products.id GROUP BY product_id ORDER BY revenue DESC LIMIT 1" }
];

// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your_dummy_api_key";

async function RAG_QueryConverter(naturalQuery) {
    naturalQuery = naturalQuery.trim().toLowerCase();

    // Step 1: Check if the query matches any history entry
    let foundEntry = queryHistory.find(entry => naturalQuery.includes(entry.naturalQuery));

    if (foundEntry) {
        let sqlQuery = foundEntry.sqlQuery;
        let remainingQuery = naturalQuery.replace(foundEntry.naturalQuery, "");
        // Step 2: If no SQL clauses exist, return the stored query immediately
        if (!containsSQLClauses(remainingQuery)) {
            return sqlQuery;
        }

        // Step 3: If SQL clauses exist, process the remaining query with AI
        else {
            let aiGeneratedSQL = await AI_ConvertToSQL(remainingQuery, false);
            return aiGeneratedSQL !== "AI failed" ? aiGeneratedSQL : "complex query, please try simpler query.";
        }

    }

   

    return "Could not generate SQL query.";
}

// 🔹 Check for SQL Clauses That May Need AI Processing
function containsSQLClauses(text) {
    const forbiddenWords = ["where", "whose", "or", "and", "from", "having","join", "group by", "order by", "limit", "offset", "distinct", "like", "between", "in", "not in"];
    return forbiddenWords.some(word => text.includes(word));
}

// 🔹 AI-Powered Query Conversion using OpenAI GPT
async function AI_ConvertToSQL(naturalQuery, isSql) {
    const db_schema = `Database Schema:
${JSON.stringify(mockDB, null, 2)}

Rules:
- Ensure SQL queries reference the correct table and columns.
- Use 'YYYY-MM-DD' format for dates.
- Use SUM(column_name) for summation, AVG(column_name) for averages.
- Use WHERE for filtering conditions.
- Default ordering should be by date (DESC) unless otherwise stated.
- If unable to generate SQL, explain **why** (missing table names, ambiguous conditions, etc.).
- If explaining a SQL query, provide both **technical** and **simple (layman’s)** explanations.
`;

    let question = isSql
        ? "Explain this SQL query step by step in both technical and simple terms:"
        : "Convert this natural language query into an SQL query:";

    const prompt = `You are the SQL database manager of my company. Here is ${db_schema} \n${question} ${naturalQuery}`;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4-turbo",
                messages: [{ role: "system", content: "You are an expert SQL assistant." }, { role: "user", content: prompt }],
                max_tokens: 200
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000  // 60 seconds timeout
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content.trim();
        }

        return "AI failed";
    } catch (error) {
        console.error("AI conversion error:", error.response ? error.response.data : error.message);
        return "AI failed";
    }
}

// 🔹 Query Explanation using OpenAI
async function queryExplainer(sqlQuery) {
    
    return await AI_ConvertToSQL(prompt, true);
}

module.exports = { RAG_QueryConverter, queryHistory, queryExplainer };
