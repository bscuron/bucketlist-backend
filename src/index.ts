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

// GET route to return all events and event attendees
app.get('/events', async (req: Request, res: Response) => {
    const user_id = req.auth.user_id;
    const events = await db('events')
        .select(
            'events.*',
            'users.username',
            db.raw(
                `CASE WHEN (attendance.user_id = ${user_id} OR events.user_id = ${user_id}) THEN 1 ELSE 0 END AS attending`
            ),
            db.raw(`GROUP_CONCAT(users.username SEPARATOR ',') AS attendees`)
        )
        .leftJoin('attendance', 'events.event_id', 'attendance.event_id')
        .leftJoin('users', 'attendance.user_id', 'users.user_id')
        .groupBy('events.event_id');
    res.status(200).json({ events: events });
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
    const host_datetime: string = req.body.host_datetime;

    if (title == undefined || title.length < 1) {
        return res.sendStatus(400); // 400 Bad Request
    }

    if (location == undefined || location.length < 1) {
        return res.sendStatus(400); // 400 Bad Request
    }

    // Check that host_datetime is in valid format
    // TODO: validate that the datetime is within a certain time range (not too far in the past, future is allowed)
    const datetime_regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!datetime_regex.test(host_datetime)) {
        return res.sendStatus(400); // 400 Bad Request
    }

    // Check that host_datetime is in the future
    const buffer_period = 5000; // 5 seconds
    if (new Date(host_datetime) <= new Date(Date.now() + buffer_period)) {
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
            created_datetime: created_datetime,
            host_datetime: host_datetime,
            organizer: req.auth.username
        });
        res.sendStatus(201); // 201 Created
    } catch (_) {
        res.sendStatus(400); // 400 Bad Request
    }
});

// GET route to retrieve profile information of `user_id` from `users` table. If `user_id` is not provided, the current user's profile is returned
app.get('/profile/:username?', async (req: Request, res: Response) => {
    const username = req.params.username || req.auth.username;
    const profile = await db('users')
        .select(
            'user_id',
            'username',
            'first_name',
            'last_name',
            'gender',
            'dob',
            'introduction',
            'picture',
            'r_datetime'
        )
        .where({ username: username })
        .first();
    if (!profile) return res.status(404).json({ error: 'User not found' });
    const user_id = profile.user_id;
    const events = await db('events')
        .select('*')
        .where({ user_id: user_id })
        .andWhere('host_datetime', '>=', new Date().toISOString())
        .orderBy('host_datetime');

    res.status(200).json({ profile: profile, events: events });
});

// TODO: wrap await in try/catch
// GET route to return profile rows from `users` table.
app.get('/profiles', async (req: Request, res: Response) => {
    const results = await db('users').select(
        'username',
        'first_name',
        'last_name',
        'gender',
        'dob',
        'introduction',
        'picture'
    );
    res.status(200).json({ rows: results });
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

// DELETE route to delete account with user_id of JWT sent in request header
app.delete('/delete', async (req: Request, res: Response) => {
    try {
        await db('users').where('user_id', req.auth.user_id).del();
        res.sendStatus(200); // 200 OK
    } catch (_) {
        res.sendStatus(500); // 500 Internal Service Error
    }
});

// DELETE route to delete event with `event_id`
app.delete('/delete/event/:event_id', async (req: Request, res: Response) => {
    try {
        await db('events')
            .where('event_id', req.params.event_id)
            .andWhere('user_id', req.auth.user_id)
            .del();
        res.sendStatus(200); // 200 OK
    } catch (_) {
        res.sendStatus(500); // 500 Internal Service Error
    }
});

// POST route to attend event with `event_id`
app.post('/attend/event/:event_id', async (req: Request, res: Response) => {
    try {
        const event = await db('events')
            .where({
                event_id: req.params.event_id
            })
            .first();
        if (!event) {
            return res.sendStatus(404); // 404 Not Found
        }

        await db('attendance').insert({
            user_id: req.auth.user_id,
            event_id: req.params.event_id
        });
        res.sendStatus(200); // 200 OK
    } catch (_) {
        res.sendStatus(500); // 500 Internal Service Error
    }
});

// POST route to abandon event with `event_id`
app.post('/abandon/event/:event_id', async (req: Request, res: Response) => {
    try {
        const event = await db('events')
            .where({
                event_id: req.params.event_id
            })
            .first();
        if (!event) {
            return res.sendStatus(404); // 404 Not Found
        }

        await db('attendance')
            .where({
                user_id: req.auth.user_id,
                event_id: req.params.event_id
            })
            .del();
        res.sendStatus(200); // 200 OK
    } catch (_) {
        res.sendStatus(500); // 500 Internal Service Error
    }
});

// Start the express server on port `process.env.PORT`
const server = app.listen(process.env.PORT, () => {
    console.log(`LOG: Server is running on port ${process.env.PORT}`);
});

export { app, server };
