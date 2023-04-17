import express, { Express } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';

// Create express application
const app: Express = express();

// Allow cross-origin requests
app.use(cors());

// Parse the incoming requests with JSON payloads
app.use(express.json());

// Validate JWTs, except for on public paths
app.use(
    expressjwt({
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256']
    }).unless({
        path: [
            '/signup',
            '/login',
            '/check_email',
            '/reset_password',
            '/reset',
            
            /^\/database\/users\/username\/[^/]+$/, // NOTE: needed for real-time form validation
            /^\/database\/users\/email\/[^/]+$/ // NOTE: needed for real-time form validation
        ]
    })
);

/**
 * Create JSON Web Token (JWT) with secret
 *
 * @param {object} payload Payload to store in JWT
 * @returns {string} JSON Web Token
 */
const createAuthToken = (payload: object): string => {
    return jwt.sign(payload, process.env.JWT_SECRET);
};

// Export the Express application
export { app, createAuthToken };
