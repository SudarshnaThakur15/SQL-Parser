const express = require("express"); // ✅ Import express
const router = express.Router();
const { RAG_QueryConverter, queryHistory, queryExplainer } = require("./NLP.js");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const users = []; // In-memory user store (Use a database in production)

// 🔹 Generate JWT Token
function generateToken(user) {
    return jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// 🔹 Register Route (Signup)
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });
    res.json({ message: "User registered successfully" });
});

// 🔹 Login Route (Signin)
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({ message: "Login successful", token });
});

//  Middleware 
function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user;
        next();
    });
}

//  Query API (Protected Route)
router.post("/query", authenticateToken, async (req, res) => {
    const userQuery = req.body.query;

    try {
        const sqlQuery = await RAG_QueryConverter(userQuery);
        res.json({ sqlQuery, message: sqlQuery.message });
    } catch (e) {
        res.status(500).json({ message: "Error in parsing query: " + e.message });
    }
});

//  Explain SQL Query with AI (Check history first)
router.post("/explain", authenticateToken, async (req, res) => {
    const query = req.body.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
        return res.status(400).json({ message: "Invalid query input" });
    }

    try {
        // 1️⃣ Check in query history
        let foundEntry = queryHistory.find(entry => entry.sqlQuery === query);

        if (foundEntry) {
            return res.json({ naturalQuery: foundEntry.naturalQuery });
        }

        // 2️⃣ Call AI for explanation
        const explanation = await queryExplainer(query);

        if (explanation && explanation !== "AI failed") {
            queryHistory.push({ sqlQuery: query, naturalQuery: explanation });
        }

        res.json({ explanation });
    } catch (e) {
        console.error("Error in explaining query:", e);
        res.status(500).json({ message: "Error in explaining query: " + e.message });
    }
});

//  Validate Query API
router.post("/validate", async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== "string" || query.trim() === "") {
            return res.status(400).json({ feasible: false, message: "Invalid query input" });
        }

        const sqlQuery = await RAG_QueryConverter(query);

        if (sqlQuery && sqlQuery !== "AI failed") {
            return res.json({ feasible: true, sqlQuery });
        } else {
            return res.json({ feasible: false, message: "Query could not be converted to SQL" });
        }
    } catch (error) {
        console.error("Validation API error:", error);
        res.status(500).json({ feasible: false, message: "Internal Server Error" });
    }
});

module.exports = router;
