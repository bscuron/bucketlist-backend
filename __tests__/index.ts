import request from 'supertest';
import { app, server } from '../src/index';
import { db } from '../src/modules/database';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('POST /signup', () => {
    afterAll((done) => {
        server.close(() => {
            console.log('LOG: Stopped server');
            done();
        });
    });

    beforeEach(async () => {
        await db('users').where('username', 'testuser').delete();
    });

    afterEach(async () => {
        await db('users').where('username', 'testuser').delete();
    });

    it('should return 201 Created if validation passes', async () => {
        const res = await request(app).post('/signup').send({
            username: 'testuser',
            email: 'testuser@bucketlist.com',
            password: 'Testing123'
        });
        expect(res.statusCode).toEqual(201);
    });

    it('should return 400 Bad Request if validation fails', async () => {
        const res = await request(app).post('/signup').send({
            username: '',
            email: '',
            password: ''
        });
        expect(res.statusCode).toEqual(400);
    });

    it('should insert into the database and return QR code URL', async () => {
        const res = await request(app).post('/signup').send({
            username: 'testuser',
            email: 'testuser@bucketlist.com',
            password: 'Testing123'
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body.qrcode).toBeDefined();
        expect(res.body.backupcode).toBeDefined();
        const user = await db('users').where('username', 'testuser').first();
        expect(user.username).toEqual('testuser');
        expect(user.secret).toBeDefined();
    });
});

describe('POST /login', () => {
    beforeAll(async () => {
        await db('users').insert({
            username: 'testuser',
            email: 'testuser@bucketlist.com',
            password: 'Testing123',
            secret: 'JBSWY3DPEHPK3PXP',
            r_datetime: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
    });

    afterAll(async () => {
        server.close(() => {
            console.log('LOG: Stopped server');
        });
        await db('users').where('username', 'testuser').delete();
    });

    it('should return 401 Unauthorized if missing credentials', async () => {
        const res = await request(app).post('/login').send({});
        expect(res.statusCode).toEqual(401);
    });

    it('should return 401 Unauthorized if no matching user and password', async () => {
        const res = await request(app).post('/login').send({
            username: 'testuser',
            password: 'wrongpassword',
            code: '123456'
        });
        expect(res.statusCode).toEqual(401);
    });

    it('should return 401 Unauthorized if invalid MFA code', async () => {
        const res = await request(app).post('/login').send({
            username: 'testuser',
            password: 'Testing123',
            code: '123'
        });
        expect(res.statusCode).toEqual(401);
    });

    it('should return 200 OK and auth token if valid credentials and MFA', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'Testing123',
                code: speakeasy.totp({
                    secret: 'JBSWY3DPEHPK3PXP'
                })
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeDefined();
    });
});

describe('GET /database/:table', () => {
    let token: string;

    let rows = [
        {
            username: 'testuser1',
            email: 'testuser1@bucketlist.com',
            password: 'Password1'
        },
        {
            username: 'testuser2',
            email: 'testuser2@bucketlist.com',
            password: 'Password2'
        }
    ];

    beforeAll(async () => {
        await db('users')
            .whereIn(
                'username',
                rows.map((r) => r.username)
            )
            .delete();
        await db('users').insert(rows);
        token = jwt.sign({}, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        server.close(() => {
            console.log('LOG: Stopped server');
        });
        await db('users')
            .whereIn(
                'username',
                rows.map((r) => r.username)
            )
            .delete();
    });

    it('should return 200 OK and the added rows in the specified table ONLY IF the JWT token is provided', async () => {
        const res = await request(app)
            .get('/database/users')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toEqual(200);
        res.body.rows.forEach((row: any) => {
            expect(res.body.rows).toContainEqual(expect.objectContaining(row));
        });
    });

    it('should return 401 Unauthorized if the JWT token is NOT provided', async () => {
        const res = await request(app).get('/database/users');
        expect(res.status).toEqual(401);
    });
});

describe('GET /database/:table/:column/:value', () => {
    let token: string;

    let rows = [
        {
            username: 'testuser1',
            email: 'testuser1@bucketlist.com',
            password: 'Password1'
        },
        {
            username: 'testuser2',
            email: 'testuser2@bucketlist.com',
            password: 'Password2'
        }
    ];

    beforeAll(async () => {
        await db('users')
            .whereIn(
                'username',
                rows.map((r) => r.username)
            )
            .delete();
        await db('users').insert(rows);
        token = jwt.sign({}, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        server.close(() => {
            console.log('LOG: Stopped server');
        });
        await db('users')
            .whereIn(
                'username',
                rows.map((r) => r.username)
            )
            .delete();
    });

    it('should return 200 OK and the added row in the specified table with the specified value in the specified column ONLY IF the JWT token is provided', async () => {
        const res = await request(app)
            .get(`/database/users/password/${rows[0].password}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toEqual(200);
        res.body.rows.forEach((row: any) => {
            expect(res.body.rows).toContainEqual(expect.objectContaining(row));
        });
    });

    it('should return 401 Unauthorized if the JWT token is NOT provided', async () => {
        const res = await request(app).get(
            `/database/users/password/${rows[0].password}`
        );
        expect(res.status).toEqual(401);
    });
});

describe('POST /database/events/create', () => {
    let token: string;

    let event = {
        title: 'Test event',
        description: 'This is a test event',
        location: 'Test place',
        host_datetime: new Date(Date.now() + 100000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ')
    };

    beforeAll(() => {
        token = jwt.sign({}, process.env.JWT_SECRET);
    });

    afterEach(async () => {
        await db('events').where(event).del();
        jest.clearAllMocks();
    });

    it('should return 201 Created if the request is valid and the user is authenticated', async () => {
        const res = await request(app)
            .post('/database/events/create')
            .send(event)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(201);
    });

    it('should return 400 Bad Request if title is invalid', async () => {
        const invalid = Object.assign({}, event, { title: undefined });

        const res = await request(app)
            .post('/database/events/create')
            .send(invalid)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(400);
    });

    it('should return 400 Bad Request if location is invalid', async () => {
        const invalid = Object.assign({}, event, {
            location: undefined
        });

        const res = await request(app)
            .post('/database/events/create')
            .send(invalid)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(400);
    });

    it('should return 400 Bad Request if host_datetime is invalid', async () => {
        const invalid = Object.assign({}, event, {
            host_datetime: 'invalid datetime'
        });

        const res = await request(app)
            .post('/database/events/create')
            .send(invalid)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(400);
    });

    it('should return 401 Unauthorized JWT is not provided in the request', async () => {
        const res = await request(app)
            .post('/database/events/create')
            .send(event);

        expect(res.status).toEqual(401);
    });
});
