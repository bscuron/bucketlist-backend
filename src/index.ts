import { Express, Request, Response } from 'express';

// Import external modules
const express = require('express');
const cors = require('cors');
const createHash = require('hash-generator');

// Import internal modules
const database = require('./modules/database');

// Create express application
const app: Express = express();

// Allow cross-origin requests
app.use(cors());

// Parse the incoming requests with JSON payloads
app.use(express.json());

// Create a POST route
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
    // Insert entry into database
    database.connection.query(
        'INSERT INTO users (username, email, password, a_code, r_datetime) VALUES (?, ?, ?, ?, ?)',
        [username, email, password, a_code, r_datetime],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ message: 'Account Created!' });
        }
    );
});

// Create a GET route to see if username exists
app.get('/database/user/:username', (req: Request, res: Response) => {
    database.connection.query(
        'SELECT username FROM users WHERE username=?',
        [req.params.username],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// Create a GET route to see if email exists
app.get('/database/email/:email', (req: Request, res: Response) => {
    database.connection.query(
        'SELECT email FROM users WHERE email=?',
        [req.params.email],
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// TODO: remove this route (just returns database contents)
// Create a GET route
app.get('/database', (req: Request, res: Response) => {
    database.connection.query(
        'SELECT * FROM users',
        (error, results, fields) => {
            if (error) throw error;
            res.json({ rows: results });
        }
    );
});

// Start the server, listen for requests on port 8000
// TODO: create variable for port
app.listen(8000, () => {
    console.log(`LOG: Server is running on port 8000`);
});
