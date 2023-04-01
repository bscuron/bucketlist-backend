import { Request as ExpressRequest, Response } from 'express';
import { db } from './modules/database';
import { app, createAuthToken } from './modules/express';
import { validate, generateQRCode } from './modules/validate';
import speakeasy, { GeneratedSecret } from 'speakeasy';

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

    const r_datetime: string = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    // Generate multi-factor authentication secret
    const secret: GeneratedSecret = speakeasy.generateSecret({
        name: `Bucketlist: ${username}`
    });

    try {
        await db('users').insert({
            username: username,
            email: email,
            password: password,
            secret: secret.ascii,
            r_datetime: r_datetime
        });
        const url: string = await generateQRCode(secret);

        // Send the QR code URL to the front-end for rendering
        return res.status(201).json({ qrcode: url, backupcode: secret.base32 }); // 201 Created
    } catch (error) {
        return res.sendStatus(500); // 500 Internal Server Error
    }
});

// TODO: wrap await in try/catch
// POST route for user login
app.post('/login', async (req: Request, res: Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    const code: string = req.body.code;

    // Missing credentials
    if (!username || !password || !code) return res.sendStatus(401); // 401 Unauthorized

    // Verify there is an account with a matching username and password
    const result = await db('users')
        .select('secret', 'user_id')
        .where({
            username: username,
            password: password
        })
        .first();
    if (!result) return res.sendStatus(401); // 401 Unauthorized

    // Verify that the TOTP MFA code is valid
    const verified: boolean = speakeasy.totp.verify({
        secret: result.secret,
        token: code,
        window: 5
    });
    if (!verified) return res.sendStatus(401); // 401 Unauthorized

    const token: string = createAuthToken({
        username: username,
        user_id: result.user_id
    });
    return res.status(200).json({ token }); // 200 OK
});

// TODO: wrap await in try/catch
// GET route to return rows in `table`
app.get('/database/:table', async (req: Request, res: Response) => {
    const results = await db(req.params.table).select('*');
    res.status(200).json({ rows: results });
});

// TODO: wrap await in try/catch
// GET route to return rows in `table` where `value` is in `column`
app.get(
    '/database/:table/:column/:value',
    async (req: Request, res: Response) => {
        const results = await db(req.params.table)
            .select('*')
            .where({ [req.params.column]: req.params.value });
        res.status(200).json({ rows: results });
    }
);

// POST route to create a new event in `events` table
app.post('/database/events/create', async (req: Request, res: Response) => {
    const title: string = req.body.title;
    const description: string = req.body.description;
    const location: string = req.body.location;
    const user_id: string = req.auth.user_id;

    if (title == undefined || title.length < 1) {
        return res.sendStatus(400); // 400 Bad Request
    }

    if (location == undefined || location.length < 1) {
        return res.sendStatus(400); // 400 Bad Request
    }

    const created_datetime: string = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    try {
        await db('events').insert({
            user_id: user_id,
            title: title,
            description: description,
            location: location,
            created_datetime: created_datetime
        });
        res.sendStatus(201); // 201 Created
    } catch (_) {
        res.sendStatus(400); // 400 Bad Request
    }
});

// GET route to retrieve profile information of `user_id` from `users` table. If `user_id` is not provided, the current user's profile is returned
app.get('/profile/:user_id?', async (req: Request, res: Response) => {
    const user_id = req.params.user_id || req.auth.user_id;
    const user = await db('users')
        .select(
            'username',
            'first_name',
            'last_name',
            'gender',
            'dob',
            'introduction',
            'picture'
        )
        .where({ user_id: user_id })
        .first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const events = await db('events').select('*').where({ user_id: user_id });

    res.status(200).json({ user, events });
});

// Post route to update profile information of user_id from users table.
app.post('/profile/edit', async (req: Request, res: Response) => {
    // TODO: validate request data

    const user = await db('users')
        .update({
            first_name: req.body.first_name || null,
            last_name: req.body.last_name || null,
            gender: req.body.gender || null,
            dob: req.body.dob || null,
            introduction: req.body.introduction || null
        })
        .where({ user_id: req.auth.user_id });
    if (!user)
        return res
            .status(404)
            .json({ error: 'User not found, cannot update profile' });
    res.sendStatus(200);
});

// Start the express server on port `process.env.PORT`
app.listen(process.env.PORT, () => {
    console.log(`LOG: Server is running on port ${process.env.PORT}`);
});
