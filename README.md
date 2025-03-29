# Natural Query to SQL API

This API allows users to convert natural language queries into SQL queries using a combination of query history and AI. It also includes user authentication using JWT.

## Features
- **User Authentication**: Register, login, and get a JWT token for authentication.
- **Convert Queries**: Convert natural language queries into SQL.
- **Explain Queries**: Get an explanation for an SQL query.
- **Validate Queries**: Check if a natural language query can be converted to SQL.

## Prerequisites
- Install [Node.js](https://nodejs.org/)
- Install [Postman](https://www.postman.com/) for testing
- Set up your `.env` file with the following:
  ```env
  
  JWT_SECRET=your_jwt_secret
  OPENAI_API_KEY=your_openai_api_key
  ```

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo.git
   cd your-repo
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   node server.js
   ```

## API Endpoints and Testing with Postman

### 1️⃣ Register a User
- **Endpoint:** `POST /register`
- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
    "username": "testuser",
    "password": "testpassword"
  }
  ```
- **Expected Response:**
  ```json
  {
    "message": "User registered successfully"
  }
  ```

### 2️⃣ Login to Get JWT Token
- **Endpoint:** `POST /login`
- **Description:** Logs in a user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "username": "testuser",
    "password": "testpassword"
  }
  ```
- **Expected Response:**
  ```json
  {
    "message": "Login successful",
    "token": "your_jwt_token"
  }
  ```
- **Copy the token** from the response. You’ll need it for authentication.

### 3️⃣ Convert Natural Query to SQL
- **Endpoint:** `POST /query`
- **Description:** Converts a natural language query into SQL.
- **Authorization Required:** Yes (Use the token from login)
- **Request Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Request Body:**
  ```json
  {
    "query": "total revenue"
  }
  ```
- **Expected Response:**
  ```json
  "SELECT SUM(amount) FROM sales"
  ```

### 4️⃣ Explain an SQL Query
- **Endpoint:** `POST /explain`
- **Description:** Returns the natural language explanation of an SQL query.
- **Authorization Required:** Yes
- **Request Body:**
  ```json
  {
    "query": "SELECT COUNT(*) FROM customers"
  }
  ```
- **Expected Response:**
  ```json
  {
    "naturalQuery": "count customers"
  }
  ```

### 5️⃣ Validate a Query
- **Endpoint:** `POST /validate`
- **Description:** Checks if a natural query can be converted to SQL.
- **Request Body:**
  ```json
  {
    "query": "show all employees"
  }
  ```
- **Expected Response:**
  ```json
  {
    "feasible": true,
    "sqlQuery": "SELECT * FROM employees"
  }
  ```

## Notes
- Always pass the JWT token in the `Authorization` header after logging in.
- If a query is not found in history, the AI will generate it.

## License
This project is open-source and free to use.

