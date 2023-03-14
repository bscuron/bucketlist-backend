import mysql, { Connection, ConnectionConfig, MysqlError } from 'mysql';

// Load project environment variables locate in `.env`
require('dotenv').config();

/**
 * Database configuration object containing sign-in credentials for
 * MySQL database. Credentials are found in `.env` located on the
 * server.
 */
const db_config: ConnectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

/**
 * Database connection used to make queries and other database related
 * activities
 */
let db: Connection;

/**
 * Create a connection to MySQL database. Attempt to reconnect on
 * error.
 */
function createConnection() {
    console.log('LOG: Connecting to database...');
    db = mysql.createConnection(db_config);

    db.connect((err: MysqlError) => {
        if (err) {
            console.error('ERROR: Failed to connect to database: ', err);
            setTimeout(createConnection, 500);
        } else {
            console.log('SUCCESS: Connected to database');
        }
    });

    db.on('error', (err: MysqlError) => {
        console.error(`ERROR: ${err}`);
        console.log('LOG: attempting to reconnect...');
        setTimeout(createConnection, 500);
    });
}

// Create the connection
createConnection();

// Export the MySQL connection
export { db };
