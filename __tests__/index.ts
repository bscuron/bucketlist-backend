import request from 'supertest';
import { app, server } from '../src/index';
import { db } from '../src/modules/database';
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
