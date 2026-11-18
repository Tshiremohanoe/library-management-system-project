const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database and routes
const db = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Books API
app.use('/api/books', bookRoutes);

// Transactions API
app.use('/api/transactions', transactionRoutes);

// Users API
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Library Management System API is running!');
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});