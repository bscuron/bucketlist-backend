import mysql, { Connection, ConnectionConfig, MysqlError } from 'mysql';

// Load project environment variables locate in `.env`
require('dotenv').config();

// Define database configuration
const db_config: ConnectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

/**
 * MySQL database connection to interact with database on linux server.
 */
let db: Connection;

// Initializes `db`'s connection. Sets up an error handler that attempts to reconnect on connection error.
function createConnection() {
    console.log('LOG: Connecting to database...');
    db = mysql.createConnection(db_config);

    // Attempt to connect to database
    db.connect((err: MysqlError) => {
        if (err) {
            console.error('ERROR: Failed to connect to database: ', err);
            setTimeout(createConnection, 500);
        } else {
            console.log('SUCCESS: Connected to database');
        }
    });

    // Error handler
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
