const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/s3Service', () => ({
	uploadToS3: jest.fn().mockResolvedValue('mock-version-id'),
	deleteFromS3: jest.fn(),
	getPresignedUrl: jest.fn(),
}));

const { uploadToS3 } = require('../services/s3Service');
const User = require('../models/User');
const File = require('../models/File');

let mongoServer;
let app;

function signToken(user) {
	return jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.MONGODB_URI = mongoServer.getUri();
	process.env.JWT_SECRET = 'files-upload-test-secret';

	app = require('../index');

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
	jest.clearAllMocks();
	await File.deleteMany({});
	await User.deleteMany({});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('POST /api/files/upload', () => {
	it('uploads file successfully and returns 201', async () => {
		const user = await User.create({
			email: 'upload@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});

		const token = signToken(user);

		const response = await request(app)
			.post('/api/files/upload')
			.set('Authorization', `Bearer ${token}`)
			.attach('file', Buffer.from('hello skyvault'), 'hello.txt');

		expect(response.status).toBe(201);
		expect(response.body.originalName).toBe('hello.txt');
		expect(response.body.s3VersionId).toBe('mock-version-id');
		expect(uploadToS3).toHaveBeenCalledTimes(1);
	});

	it('returns 401 when auth token is missing', async () => {
		const response = await request(app)
			.post('/api/files/upload')
			.attach('file', Buffer.from('hello skyvault'), 'hello.txt');

		expect(response.status).toBe(401);
		expect(response.body.error).toBe('No token provided');
	});

	it('returns 413 when user storage quota is exceeded', async () => {
		const user = await User.create({
			email: 'quota@example.com',
			passwordHash: 'password123',
			storageUsed: 2 * 1024 * 1024 * 1024,
		});

		const token = signToken(user);

		const response = await request(app)
			.post('/api/files/upload')
			.set('Authorization', `Bearer ${token}`)
			.attach('file', Buffer.from('hello skyvault'), 'hello.txt');

		expect(response.status).toBe(413);
		expect(response.body.error).toBe('Storage quota exceeded. Max 2 GB.');
	});

	it('increments user storageUsed after successful upload', async () => {
		const user = await User.create({
			email: 'storage@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});

		const token = signToken(user);
		const fileBuffer = Buffer.from('1234567890');

		const response = await request(app)
			.post('/api/files/upload')
			.set('Authorization', `Bearer ${token}`)
			.attach('file', fileBuffer, 'size-check.txt');

		expect(response.status).toBe(201);

		const updatedUser = await User.findById(user._id);
		expect(updatedUser.storageUsed).toBe(fileBuffer.length);
	});
});

