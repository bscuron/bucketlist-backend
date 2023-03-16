import { Request, Response } from 'express';
import createHash from 'hash-generator';
import * as db from './modules/database';
import { app, createAuthToken } from './modules/express';
import { validate } from './modules/validate';

// Load project environment variables locate in `.env`
require('dotenv').config();

// TODO: wrap await in try/catch
// POST route for user signup
app.post('/signup', async (req: Request, res: Response) => {
    const username: string = req.body.username;
    const email: string = req.body.email;
    const password: string = req.body.password;

    const valid: boolean = await validate(username, email, password);
    if (!valid) {
        return res.sendStatus(400); // 400 Bad Request
    }

    const a_code: string = createHash(25);
    const r_datetime: string = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

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

// TODO: wrap await in try/catch
// POST route for user login
app.post('/login', async (req: Request, res: Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    const result: boolean = await db.contains('users', {
        username: username,
        password: password
    });
    if (!result) return res.sendStatus(401); // 401 Unauthorized
    const token: string = createAuthToken({ username: username });
    return res.status(200).json({ token }); // 200 OK
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
