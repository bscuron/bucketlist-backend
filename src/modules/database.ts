import knex, { Knex } from 'knex';

// Load project environment variables locate in `.env`
require('dotenv').config();

// Interface declaration for Knex configuration
interface KnexConfig {
    client: string;
    connection: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
}

// Define database configuration
const config: KnexConfig = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        port: 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
};

/**
 * Knex query builder
 */
let db: Knex;

async function createConnection() {
    db = knex(config);

    try {
        await db.raw('SELECT 1');
        console.log('SUCCESS: Connected to database');
    } catch (err) {
        console.error('ERROR: Failed to connect to database: ', err);
        setTimeout(createConnection, 500);
    }

    db.on('error', (err) => {
        console.error('ERROR: Lost database connection: ', err);
        setTimeout(createConnection, 500);
    });
}

createConnection();

// Export the Knex connection
export { db };
