const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/s3Service', () => ({
	uploadToS3: jest.fn().mockResolvedValue('upload-version-id'),
	deleteFromS3: jest.fn().mockResolvedValue(undefined),
	getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/shared-download-url'),
	copyVersionToS3: jest.fn().mockResolvedValue('copy-version-id'),
}));

const { getPresignedUrl } = require('../services/s3Service');
const User = require('../models/User');
const File = require('../models/File');
const Share = require('../models/Share');

let mongoServer;
let app;

function signToken(user) {
	return jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
		expiresIn: '24h',
	});
}

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.MONGODB_URI = mongoServer.getUri();
	process.env.JWT_SECRET = 'sharing-test-secret';

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
	await Share.deleteMany({});
	await File.deleteMany({});
	await User.deleteMany({});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Sharing routes', () => {
	it('creates expiring share URL for owned file', async () => {
		const user = await User.create({
			email: 'owner@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const token = signToken(user);

		const file = await File.create({
			userId: user._id,
			originalName: 'shared.pdf',
			s3Key: 'uploads/shared.pdf',
			s3VersionId: 'v1',
			mimeType: 'application/pdf',
			size: 123,
			isDeleted: false,
		});

		const response = await request(app)
			.post(`/api/files/${file._id}/share`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(201);
		expect(response.body.shareUrl).toBe('https://example.com/shared-download-url');
		expect(new Date(response.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
		expect(getPresignedUrl).toHaveBeenCalledWith(file.s3Key, 3600);

		const savedShares = await Share.find({ fileId: file._id });
		expect(savedShares).toHaveLength(1);
	});

	it('returns 404 when sharing non-owned file', async () => {
		const owner = await User.create({
			email: 'owner2@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const otherUser = await User.create({
			email: 'other@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const token = signToken(otherUser);

		const file = await File.create({
			userId: owner._id,
			originalName: 'private.txt',
			s3Key: 'uploads/private.txt',
			s3VersionId: 'v1',
			mimeType: 'text/plain',
			size: 10,
			isDeleted: false,
		});

		const response = await request(app)
			.post(`/api/files/${file._id}/share`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(404);
		expect(response.body.error).toBe('File not found');
	});

	it('GET /api/files/:id/shares returns only non-expired shares', async () => {
		const user = await User.create({
			email: 'shares-list@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const token = signToken(user);

		const file = await File.create({
			userId: user._id,
			originalName: 'draft.txt',
			s3Key: 'uploads/draft.txt',
			s3VersionId: 'v1',
			mimeType: 'text/plain',
			size: 20,
			isDeleted: false,
		});

		await Share.create({
			fileId: file._id,
			createdBy: user._id,
			presignedUrl: 'https://example.com/expired',
			expiresAt: new Date(Date.now() - 60_000),
		});

		await Share.create({
			fileId: file._id,
			createdBy: user._id,
			presignedUrl: 'https://example.com/active',
			expiresAt: new Date(Date.now() + 60_000),
		});

		const response = await request(app)
			.get(`/api/files/${file._id}/shares`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(1);
		expect(response.body[0].presignedUrl).toBe('https://example.com/active');
	});
});

