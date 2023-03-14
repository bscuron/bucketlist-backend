import { Connection, ConnectionConfig, MysqlError } from 'mysql';

// Load project environment variables locate in `.env`
require('dotenv').config();

// Load external module
const mysql = require('mysql');

// Define database configuration
const db_config: ConnectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Database connection to be exported
let connection: Connection;

// Create a connection to MySQL database
function createConnection() {
    console.log('LOG: Connecting to database...');
    connection = mysql.createConnection(db_config);

    // Attempt to connect to database
    connection.connect((err: MysqlError) => {
        if (err) {
            console.error('ERROR: Failed to connect to database: ', err);
            setTimeout(createConnection, 500);
        } else {
            console.log('SUCCESS: Connected to database');
        }
    });

    // Error handler
    connection.on('error', (err: MysqlError) => {
        console.error(`ERROR: ${err}`);
        console.log('LOG: attempting to reconnect...');
        setTimeout(createConnection, 500);
    });
}

// Create the connection
createConnection();

// Export the MySQL connection
module.exports = {
    connection
};
