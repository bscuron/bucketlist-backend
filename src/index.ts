import { Request as ExpressRequest, Response } from 'express';
import createHash from 'hash-generator';
import { db } from './modules/database';
import { app, createAuthToken } from './modules/express';
import { validate } from './modules/validate';

// Extend ExpressRequest interface to include authentication (needed for JWT)
interface Request extends ExpressRequest {
    auth?: any;
}

// Load project environment variables locate in `.env`
require('dotenv').config();

// TODO: wrap await in try/catch
// POST route for user signup
app.post('/signup', async (req: Request, res: Response) => {
    const username: string = req.body.username;
    const email: string = req.body.email;
    const password: string = req.body.password;

    const valid: boolean = await validate(username, email, password);
    if (!valid) {
        return res.sendStatus(400); // 400 Bad Request
    }

    const a_code: string = createHash(25);
    const r_datetime: string = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    try {
        await db('users').insert({
            username: username,
            email: email,
            password: password,
            a_code: a_code,
            r_datetime: r_datetime
        });
        return res.sendStatus(201); // 201 Created
    } catch (error) {
        return res.sendStatus(500); // 500 Internal Server Error
    }
});

// TODO: wrap await in try/catch
// POST route for user login
app.post('/login', async (req: Request, res: Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    const result: boolean = !!(await db('users')
        .select('*')
        .where({
            username: username,
            password: password
        })
        .first());
    if (!result) return res.sendStatus(401); // 401 Unauthorized
    const token: string = createAuthToken({ username: username });
    return res.status(200).json({ token }); // 200 OK
});

// TODO: return status code
// TODO: wrap await in try/catch
// GET route to see if username exists
app.get('/database/user/:username', async (req: Request, res: Response) => {
    const results = await db('users')
        .select('username')
        .where({ username: req.params.username });
    res.json({ rows: results });
});

// TODO: return status code
// TODO: wrap await in try/catch
// GET route to see if email exists
app.get('/database/email/:email', async (req: Request, res: Response) => {
    const results = await db('users')
        .select('email')
        .where({ email: req.params.email });
    res.json({ rows: results });
});

// TODO: return status code
// TODO: wrap await in try/catch
// TODO: remove this route (just returns database contents)
// GET route to retrieve database contents
app.get('/database', async (req: Request, res: Response) => {
    const results = await db('users').select('*');
    res.json({ rows: results });
});

// TODO: remove, this is just an example protected route
app.get('/protected', (req: Request, res: Response) => {
    return res.json({ message: `Your JWT: ${JSON.stringify(req.auth)}` });
});

// Start the express server on port `process.env.PORT`
app.listen(process.env.PORT, () => {
    console.log(`LOG: Server is running on port ${process.env.PORT}`);
});
