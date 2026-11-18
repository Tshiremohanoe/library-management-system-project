const express = require('express');
const router = express.Router();
const db = require('../config/db');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

// GET ALL BOOKS - PUBLIC
router.get('/', (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// ADD BOOK - ADMIN ONLY
router.post(
    '/',
    authenticateToken,
    authorizeRole('admin'),
    (req, res) => {
        const { title, author, genre, isbn, quantity } = req.body;

        if (
            !title ||
            !author ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            return res.status(400).json({
                message: 'Title, author and a valid quantity are required.'
            });
        }

        const sql = `
            INSERT INTO books (title, author, genre, isbn, quantity)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [title, author, genre || null, isbn || null, quantity],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: 'Book added successfully!',
                    book_id: result.insertId
                });
            }
        );
    }
);

// UPDATE BOOK - ADMIN ONLY
router.put(
    '/:id',
    authenticateToken,
    authorizeRole('admin'),
    (req, res) => {
        const { title, author, genre, isbn, quantity } = req.body;
        const { id } = req.params;

        if (
            !title ||
            !author ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            return res.status(400).json({
                message: 'Provide valid book details and quantity.'
            });
        }

        const sql = `
            UPDATE books
            SET title = ?, author = ?, genre = ?, isbn = ?, quantity = ?
            WHERE book_id = ?
        `;

        db.query(
            sql,
            [title, author, genre || null, isbn || null, quantity, id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: 'Book not found.'
                    });
                }

                res.json({
                    message: 'Book updated successfully!'
                });
            }
        );
    }
);

// DELETE BOOK - ADMIN ONLY
router.delete(
    '/:id',
    authenticateToken,
    authorizeRole('admin'),
    (req, res) => {
        const { id } = req.params;

        db.query(
            'DELETE FROM books WHERE book_id = ?',
            [id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: 'Book not found.'
                    });
                }

                res.json({
                    message: 'Book deleted successfully!'
                });
            }
        );
    }
);

module.exports = router;