import { Request, Response } from 'express';
import createHash from 'hash-generator';
import * as db from './modules/database';
import { app, createAuthToken } from './modules/express';

// Load project environment variables locate in `.env`
require('dotenv').config();

// POST route for user signup
app.post('/signup', (req: Request, res: Response) => {
    const username: string = req.body.username;
    const email: string = req.body.email;
    const password: string = req.body.password;
    const a_code: string = createHash(25);
    const r_datetime: string = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    // TODO: better validate user data and secure password
    if (username.length < 1 || email.length < 1 || password.length < 1) return;

    // TODO: check if username or email are already in database
    db.connection.query(
        'INSERT INTO users (username, email, password, a_code, r_datetime) VALUES (?, ?, ?, ?, ?)',
        [username, email, password, a_code, r_datetime],
        (error, results, fields) => {
            if (error) {
                return res.sendStatus(500); // 500 Internal Server Error
            }
            return res.sendStatus(201); // 201 Created
        }
    );
});

// POST route for user login
app.post('/login', (req: Request, res: Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    db.contains('users', { username: username, password: password })
        .then((result) => {
            if (!result) return res.sendStatus(401); // 401 Unauthorized
            const token: string = createAuthToken({ username: username });
            return res.status(200).json({ token }); // 200 OK
        })
        .catch((error) => {
            throw error;
        });
});

// TODO: return status code
// GET route to see if username exists
app.get('/database/user/:username', (req: Request, res: Response) => {
    db.connection.query(
        'SELECT username FROM users WHERE username=?',
        [req.params.username],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// TODO: return status code
// GET route to see if email exists
app.get('/database/email/:email', (req: Request, res: Response) => {
    db.connection.query(
        'SELECT email FROM users WHERE email=?',
        [req.params.email],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// TODO: return status code
// TODO: remove this route (just returns database contents)
// GET route to retrieve database contents
app.get('/database', (req: Request, res: Response) => {
    db.connection.query('SELECT * FROM users', (error, results, fields) => {
        if (error) throw error;
        res.json({ rows: results });
    });
});

// Start the express server on port `process.env.PORT`
app.listen(process.env.PORT, () => {
    console.log(`LOG: Server is running on port ${process.env.PORT}`);
});
