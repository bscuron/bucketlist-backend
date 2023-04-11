import request from 'supertest';
import { app, server } from '../src/index';
import { db } from '../src/modules/database';
import speakeasy from 'speakeasy';
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
            console.log('Server stopped');
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
