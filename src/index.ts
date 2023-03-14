import { Request, Response } from 'express';
import createHash from 'hash-generator';
import { db } from './modules/database';
import { app } from './modules/express';

// Load project environment variables locate in `.env`
require('dotenv').config();

/**
 * POST route for user signup
 *
 * @param {Request} req Request with POST data
 * @param {Response} res JSON Response
 */
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
    db.query(
        'INSERT INTO users (username, email, password, a_code, r_datetime) VALUES (?, ?, ?, ?, ?)',
        [username, email, password, a_code, r_datetime],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ message: 'Account Created!' });
        }
    );
});

/**
 * GET route to get `user` from database. Used to check if user exists
 * in database.
 *
 * @param {Request} req Request with GET data
 * @param {Response} res JSON Response
 */
app.get('/database/user/:username', (req: Request, res: Response) => {
    db.query(
        'SELECT username FROM users WHERE username=?',
        [req.params.username],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

/**
 * GET route to get `user` from database. Used to check if email
 * exists in database.
 *
 * @param {Request} req Request with GET data
 * @param {Response} res JSON Response
 */
app.get('/database/email/:email', (req: Request, res: Response) => {
    db.query(
        'SELECT email FROM users WHERE email=?',
        [req.params.email],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// TODO: remove this route (just returns database contents)
/**
 * GET route to access database contents
 *
 * @param {Request} req Request with GET data
 * @param {Response} res JSON Response
 */
app.get('/database', (req: Request, res: Response) => {
    db.query('SELECT * FROM users', (error, results, fields) => {
        if (error) throw error;
        res.json({ rows: results });
    });
});

// TODO: create variable for port
/**
 * Start the server, listen for requests on port defined in `.env`
 */
app.listen(process.env.PORT, () => {
    console.log(`LOG: Server is running on port ${process.env.PORT}`);
});
