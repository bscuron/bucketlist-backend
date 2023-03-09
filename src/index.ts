import { Express, Request, Response } from 'express';
import { Connection, ConnectionConfig, MysqlError } from 'mysql';

// Load project environment variables (located in `.env`)
require('dotenv').config();

// Important external modules
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const createHash = require('hash-generator');

// Connect to the database
const db_config: ConnectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Create mysql database connection
let connection: Connection;

// Function that connects to the MySQL database. Automatically tries to reconnect if connection is lost.
function handle_disconnect() {
    console.log('LOG: Connecting to database...');
    connection = mysql.createConnection(db_config);

    // Attempt to connect to database
    connection.connect((err: MysqlError) => {
        // Failed to connect
        if (err) {
            console.log('ERROR: Failed to connect to database: ', err);
            setTimeout(handle_disconnect, 500);
        }

        // Connection succeeded
        else {
            console.log('SUCCESS: Connected to database');
        }
    });

    // Error handler
    connection.on('error', (err: MysqlError) => {
        // Lost connection to the database, attempt to reconnect
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('WARNING: Database connection lost');
            handle_disconnect();
        }

        // Throw error not related to connection lost
        else {
            throw err;
        }
    });
}

// Try to establish a connection to the database
handle_disconnect();

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

    // Insert entry into database
    connection.query(
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
    connection.query(
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
    connection.query(
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
    connection.query('SELECT * FROM users', (error, results, fields) => {
        if (error) throw error;
        res.json({ rows: results });
    });
});

// Start the server, listen for requests on port 8000
// TODO: create variable for port
app.listen(8000, () => {
    console.log(`LOG: Server is running on port 8000`);
});
