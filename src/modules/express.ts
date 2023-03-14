import express, { Express } from 'express';
import cors from 'cors';

// Create express application
const app: Express = express();

// Allow cross-origin requests
app.use(cors());

// Parse the incoming requests with JSON payloads
app.use(express.json());

// Export the Express application
export { app };
