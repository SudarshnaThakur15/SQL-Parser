const express = require('express');
const router = require('./routes'); // Correcting the import path

const app = express();

app.use(express.json()); // Middleware to parse JSON requests

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/', router); // Register routes

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
