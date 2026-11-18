const express = require('express');
const router = express.Router();
const db = require('../config/db');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

// GET TRANSACTIONS
// Admins can view all transactions.
// Members can view only their own transactions.
router.get(
    '/',
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT transactions.*, books.title, users.full_name
            FROM transactions
            JOIN books ON transactions.book_id = books.book_id
            LEFT JOIN users ON transactions.user_id = users.user_id
            ${req.user.role === 'admin' ? '' : 'WHERE transactions.user_id = ?'}
            ORDER BY transactions.transaction_date DESC
        `;

        const values = req.user.role === 'admin'
            ? []
            : [req.user.user_id];

        db.query(sql, values, (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        });
    }
);

// POST TRANSACTION
// Members can borrow and return.
// Admins can borrow, return and restock.
router.post(
    '/',
    authenticateToken,
    (req, res) => {

        const {
            book_id,
            user_id,
            transaction_type,
            quantity
        } = req.body;

        const validTypes = ['borrow', 'return', 'restock'];

        if (
            !Number.isInteger(Number(book_id)) ||
            Number(book_id) <= 0 ||
            !validTypes.includes(transaction_type) ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                message: 'Provide a valid book, transaction type and quantity.'
            });
        }

        // Members cannot restock books.
        if (
            req.user.role === 'member' &&
            transaction_type === 'restock'
        ) {
            return res.status(403).json({
                message: 'Only administrators can restock books.'
            });
        }

        // Only admins and members are allowed to transact.
        if (!['admin', 'member'].includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to perform transactions.'
            });
        }

        let transactionUserId = null;

        if (
            transaction_type === 'borrow' ||
            transaction_type === 'return'
        ) {

            if (req.user.role === 'member') {
                // Members can transact only under their own account.
                transactionUserId = req.user.user_id;

            } else {
                // Admins must select a member.
                if (
                    !Number.isInteger(Number(user_id)) ||
                    Number(user_id) <= 0
                ) {
                    return res.status(400).json({
                        message: 'Select a valid member.'
                    });
                }

                transactionUserId = Number(user_id);
            }
        }

        db.beginTransaction((err) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            db.query(
                'SELECT quantity FROM books WHERE book_id = ? FOR UPDATE',
                [book_id],
                (err, books) => {

                    if (err || books.length === 0) {
                        return db.rollback(() => {
                            res.status(err ? 500 : 404).json({
                                message: err
                                    ? err.message
                                    : 'Book not found.'
                            });
                        });
                    }

                    const currentStock = books[0].quantity;

                    // CHECK STOCK BEFORE BORROWING
                    if (
                        transaction_type === 'borrow' &&
                        currentStock < quantity
                    ) {
                        return db.rollback(() => {
                            res.status(400).json({
                                message: 'Not enough books available.'
                            });
                        });
                    }

                    // CHECK OUTSTANDING BORROWED BOOKS BEFORE RETURNING
                    if (transaction_type === 'return') {

                        const sql = `
                            SELECT
                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN transaction_type = 'borrow'
                                            THEN quantity
                                            WHEN transaction_type = 'return'
                                            THEN -quantity
                                            ELSE 0
                                        END
                                    ),
                                    0
                                ) AS outstanding
                            FROM transactions
                            WHERE book_id = ?
                            AND user_id = ?
                        `;

                        return db.query(
                            sql,
                            [book_id, transactionUserId],
                            (err, results) => {

                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: err.message
                                        });
                                    });
                                }

                                const outstanding = Number(
                                    results[0].outstanding
                                );

                                if (outstanding < quantity) {
                                    return db.rollback(() => {
                                        res.status(400).json({
                                            message: `Invalid return. This member has only ${outstanding} outstanding borrowed copies.`
                                        });
                                    });
                                }

                                saveTransaction(currentStock);
                            }
                        );
                    }

                    saveTransaction(currentStock);
                }
            );

            function saveTransaction(currentStock) {

                let newStock;

                if (transaction_type === 'borrow') {
                    newStock = currentStock - quantity;
                } else {
                    newStock = currentStock + quantity;
                }

                db.query(
                    'UPDATE books SET quantity = ? WHERE book_id = ?',
                    [newStock, book_id],
                    (err) => {

                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: err.message
                                });
                            });
                        }

                        const sql = `
                            INSERT INTO transactions
                            (book_id, user_id, transaction_type, quantity)
                            VALUES (?, ?, ?, ?)
                        `;

                        db.query(
                            sql,
                            [
                                book_id,
                                transactionUserId,
                                transaction_type,
                                quantity
                            ],
                            (err, result) => {

                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: err.message
                                        });
                                    });
                                }

                                db.commit((err) => {

                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({
                                                error: err.message
                                            });
                                        });
                                    }

                                    res.status(201).json({
                                        message: 'Transaction recorded successfully!',
                                        transaction_id: result.insertId,
                                        remaining_stock: newStock
                                    });
                                });
                            }
                        );
                    }
                );
            }
        });
    }
);

module.exports = router;