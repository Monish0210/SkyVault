const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;
let User;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.MONGODB_URI = mongoServer.getUri();
	process.env.JWT_SECRET = 'test-secret-key-for-auth-tests';

	app = require('../index');
	User = require('../models/User');

	if (mongoose.connection.readyState !== 1) {
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('Mongo connection timeout')), 10000);

			mongoose.connection.once('connected', () => {
				clearTimeout(timeout);
				resolve();
			});

			mongoose.connection.once('error', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		});
	}
});

afterEach(async () => {
	await User.deleteMany({});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Auth routes', () => {
	it('registers a user with valid payload', async () => {
		const response = await request(app).post('/api/auth/register').send({
			email: 'test@example.com',
			password: 'password123',
		});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty('token');
		expect(response.body.user.email).toBe('test@example.com');
		expect(response.body.user).toHaveProperty('userId');
	});

	it('returns 409 for duplicate email registration', async () => {
		await request(app).post('/api/auth/register').send({
			email: 'duplicate@example.com',
			password: 'password123',
		});

		const response = await request(app).post('/api/auth/register').send({
			email: 'duplicate@example.com',
			password: 'password123',
		});

		expect(response.status).toBe(409);
		expect(response.body.error).toBe('Email already registered');
	});

	it('returns 400 for short password', async () => {
		const response = await request(app).post('/api/auth/register').send({
			email: 'short@example.com',
			password: 'short',
		});

		expect(response.status).toBe(400);
	});

	it('returns 400 for invalid email format', async () => {
		const response = await request(app).post('/api/auth/register').send({
			email: 'invalid-email-format',
			password: 'password123',
		});

		expect(response.status).toBe(400);
	});

	it('logs in a user with valid credentials', async () => {
		await request(app).post('/api/auth/register').send({
			email: 'login@example.com',
			password: 'password123',
		});

		const response = await request(app).post('/api/auth/login').send({
			email: 'login@example.com',
			password: 'password123',
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('token');
		expect(response.body.user.email).toBe('login@example.com');
	});

	it('returns same 401 error for wrong password', async () => {
		await request(app).post('/api/auth/register').send({
			email: 'wrongpass@example.com',
			password: 'password123',
		});

		const response = await request(app).post('/api/auth/login').send({
			email: 'wrongpass@example.com',
			password: 'incorrect-password',
		});

		expect(response.status).toBe(401);
		expect(response.body.error).toBe('Invalid credentials');
	});

	it('returns same 401 error for non-existent email', async () => {
		const response = await request(app).post('/api/auth/login').send({
			email: 'missing@example.com',
			password: 'password123',
		});

		expect(response.status).toBe(401);
		expect(response.body.error).toBe('Invalid credentials');
	});
});

