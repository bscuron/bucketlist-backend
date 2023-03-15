import express, { Express } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

// Create express application
const app: Express = express();

// Allow cross-origin requests
app.use(cors());

// Parse the incoming requests with JSON payloads
app.use(express.json());

const createAuthToken = (payload: object): string => {
    return jwt.sign(payload, process.env.JWT_SECRET);
};

// Export the Express application
export { app, createAuthToken };
