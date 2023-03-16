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
let connection: Connection;

// Initializes `connection`'s connection. Sets up an error handler that attempts to reconnect on connection error.
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

/**
 * Check if `table` contains key-value `pairs`
 *
 * @params {string} table Table to check in to see if key-value pairs exist
 * @params {object} pairs Key-value pair object where keys are column names of `table` and values are row values
 * @example
 * In this example, we are checking the `users` table to see
 * if `username` appears in column `username` and `password` appears
 * in column `password`
 * ```ts
 * const result: boolean = await db.contains('users', {
 *     username: username,
 *     password: password
 * });
 */
const contains = (table: string, pairs: object): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const [keys, values] = [Object.keys(pairs), Object.values(pairs)];
        if (keys.length <= 0 || values.length <= 0) return resolve(false);

        const conditional: string = '??=? AND '
            .repeat(keys.length)
            .slice(0, -5);
        connection.query(
            `SELECT * FROM ?? WHERE ${conditional}`,
            [
                table,
                Object.entries(pairs).flatMap(([key, value]) => [key, value])
            ].flat(),
            (error, results, _) => {
                if (error) return reject(error);
                resolve(results.length > 0);
            }
        );
    });
};

// Export the MySQL connection
export { connection, contains };
