const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');


// REGISTER NEW MEMBER - PUBLIC
router.post('/register', async (req, res) => {
    const {
        full_name,
        membership_id,
        username,
        password
    } = req.body;

    if (!full_name || !membership_id || !username || !password) {
        return res.status(400).json({
            message: 'All registration details are required.'
        });
    }

    if (
        typeof full_name !== 'string' ||
        typeof membership_id !== 'string' ||
        typeof username !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            message: 'Invalid registration details.'
        });
    }

    const cleanName = full_name.trim();
    const cleanMembershipId = membership_id.trim();
    const cleanUsername = username.trim();

    if (!cleanName || !cleanMembershipId || !cleanUsername) {
        return res.status(400).json({
            message: 'Please provide valid registration details.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'Password must contain at least 8 characters.'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (full_name, membership_id, username, password, role)
            VALUES (?, ?, ?, ?, 'member')
        `;

        db.query(
            sql,
            [
                cleanName,
                cleanMembershipId,
                cleanUsername,
                hashedPassword
            ],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            message: 'Username or membership ID already exists.'
                        });
                    }

                    console.error('Registration error:', err);

                    return res.status(500).json({
                        message: 'Registration failed. Please try again.'
                    });
                }

                res.status(201).json({
                    message: 'Account created successfully! You can now log in.',
                    user_id: result.insertId
                });
            }
        );

    } catch (err) {
        console.error('Password hashing error:', err);

        res.status(500).json({
            message: 'Could not secure your password.'
        });
    }
});


// LOGIN
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required.'
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            message: 'Authentication is not configured.'
        });
    }

    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: 'Invalid username or password.'
                });
            }

            const user = results[0];

            try {
                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        message: 'Invalid username or password.'
                    });
                }

                const token = jwt.sign(
                    {
                        user_id: user.user_id,
                        role: user.role,
                        is_super_admin: Boolean(user.is_super_admin)
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '2h' }
                );

                res.json({
                    message: 'Login successful!',
                    token,
                    user: {
                        user_id: user.user_id,
                        full_name: user.full_name,
                        membership_id: user.membership_id,
                        username: user.username,
                        role: user.role,
                        is_super_admin: Boolean(user.is_super_admin)
                    }
                });

            } catch (error) {
                console.error('Login error:', error);

                res.status(500).json({
                    message: 'Login could not be completed.'
                });
            }
        }
    );
});


// GET ALL USERS - ADMIN ONLY
router.get(
    '/',
    authenticateToken,
    authorizeRole('admin'),
    (req, res) => {
        const sql = `
            SELECT
                user_id,
                full_name,
                membership_id,
                username,
                role,
                is_super_admin,
                created_at
            FROM users
            ORDER BY user_id DESC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        });
    }
);


// ADD USER - ADMIN ONLY
router.post(
    '/',
    authenticateToken,
    authorizeRole('admin'),
    async (req, res) => {
        const {
            full_name,
            membership_id,
            username,
            password,
            role
        } = req.body;

        if (!full_name || !membership_id || !username || !password) {
            return res.status(400).json({
                message: 'All user details are required.'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        const userRole = role || 'member';

        if (!['admin', 'member'].includes(userRole)) {
            return res.status(400).json({
                message: 'Role must be admin or member.'
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `
                INSERT INTO users
                (full_name, membership_id, username, password, role)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    full_name.trim(),
                    membership_id.trim(),
                    username.trim(),
                    hashedPassword,
                    userRole
                ],
                (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({
                                message: 'Username or membership ID already exists.'
                            });
                        }

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message: 'User added successfully!',
                        user_id: result.insertId
                    });
                }
            );

        } catch (err) {
            res.status(500).json({
                error: 'Could not secure the password.'
            });
        }
    }
);


// UPDATE USER - ADMIN ONLY
router.put(
    '/:id',
    authenticateToken,
    authorizeRole('admin'),
    async (req, res) => {
        const {
            full_name,
            membership_id,
            username,
            password,
            role
        } = req.body;

        const { id } = req.params;

        if (!full_name || !membership_id || !username) {
            return res.status(400).json({
                message: 'Name, membership ID and username are required.'
            });
        }

        if (
            role !== undefined &&
            !['admin', 'member'].includes(role)
        ) {
            return res.status(400).json({
                message: 'Role must be admin or member.'
            });
        }

        if (
            password !== undefined &&
            password !== '' &&
            (typeof password !== 'string' || password.length < 8)
        ) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        // Check whether the target account is protected
        db.query(
            'SELECT is_super_admin FROM users WHERE user_id = ?',
            [id],
            async (checkErr, rows) => {
                if (checkErr) {
                    return res.status(500).json({
                        message: 'Could not verify user permissions.'
                    });
                }

                if (rows.length === 0) {
                    return res.status(404).json({
                        message: 'User not found.'
                    });
                }

                if (rows[0].is_super_admin) {
                    return res.status(403).json({
                        message: 'The Super Admin account is protected and cannot be edited.'
                    });
                }

                try {
                    let sql = `
                        UPDATE users
                        SET full_name = ?,
                            membership_id = ?,
                            username = ?
                    `;

                    const values = [
                        full_name.trim(),
                        membership_id.trim(),
                        username.trim()
                    ];

                    if (password) {
                        const hashedPassword = await bcrypt.hash(
                            password,
                            10
                        );

                        sql += ', password = ?';
                        values.push(hashedPassword);
                    }

                    if (role) {
                        sql += ', role = ?';
                        values.push(role);
                    }

                    sql += ' WHERE user_id = ?';
                    values.push(id);

                    db.query(sql, values, (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                message: 'User not found.'
                            });
                        }

                        res.json({
                            message: 'User updated successfully!'
                        });
                    });

                } catch (err) {
                    console.error('Update error:', err);

                    res.status(500).json({
                        error: 'Could not update user.'
                    });
                }
            }
        );
    }
);


// DELETE USER - ADMIN ONLY
router.delete(
    '/:id',
    authenticateToken,
    authorizeRole('admin'),
    (req, res) => {
        const { id } = req.params;

        if (Number(id) === Number(req.user.user_id)) {
            return res.status(400).json({
                message: 'You cannot delete your own account.'
            });
        }

        // Check whether the target account is protected
        db.query(
            'SELECT is_super_admin FROM users WHERE user_id = ?',
            [id],
            (checkErr, rows) => {
                if (checkErr) {
                    return res.status(500).json({
                        message: 'Could not verify user permissions.'
                    });
                }

                if (rows.length === 0) {
                    return res.status(404).json({
                        message: 'User not found.'
                    });
                }

                if (rows[0].is_super_admin) {
                    return res.status(403).json({
                        message: 'The Super Admin account cannot be deleted.'
                    });
                }

                db.query(
                    'DELETE FROM users WHERE user_id = ?',
                    [id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                message: 'User not found.'
                            });
                        }

                        res.json({
                            message: 'User deleted successfully!'
                        });
                    }
                );
            }
        );
    }
);


// EXPORT ROUTER
module.exports = router;