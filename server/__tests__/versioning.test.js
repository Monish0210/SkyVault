const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/s3Service', () => ({
	uploadToS3: jest.fn().mockResolvedValue('upload-version-id'),
	deleteFromS3: jest.fn().mockResolvedValue(undefined),
	getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/url'),
	copyVersionToS3: jest.fn().mockResolvedValue('restored-version-id'),
}));

const { copyVersionToS3 } = require('../services/s3Service');
const User = require('../models/User');
const File = require('../models/File');

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
	process.env.JWT_SECRET = 'versioning-test-secret';

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

describe('Versioning routes', () => {
	it('accepts parentFileId on upload and stores ownership-linked parent', async () => {
		const user = await User.create({
			email: 'parent@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const token = signToken(user);

		const parent = await File.create({
			userId: user._id,
			originalName: 'notes.txt',
			s3Key: 'uploads/notes-parent.txt',
			s3VersionId: 'v-parent',
			mimeType: 'text/plain',
			size: 10,
			isDeleted: false,
		});

		const response = await request(app)
			.post(`/api/files/upload?parentFileId=${parent._id}`)
			.set('Authorization', `Bearer ${token}`)
			.attach('file', Buffer.from('new content'), 'notes.txt');

		expect(response.status).toBe(201);
		expect(response.body.parentFileId).toBe(parent._id.toString());
	});

	it('GET /api/files/:id/versions returns versions with newest marked current', async () => {
		const user = await User.create({
			email: 'versions@example.com',
			passwordHash: 'password123',
			storageUsed: 0,
		});
		const token = signToken(user);

		const first = await File.create({
			userId: user._id,
			originalName: 'plan.docx',
			s3Key: 'uploads/plan-v1.docx',
			s3VersionId: 'v1',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			size: 100,
			createdAt: new Date('2026-03-15T10:00:00.000Z'),
			isDeleted: false,
		});

		await File.create({
			userId: user._id,
			originalName: 'plan.docx',
			s3Key: 'uploads/plan-v2.docx',
			s3VersionId: 'v2',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			size: 120,
			createdAt: new Date('2026-03-16T10:00:00.000Z'),
			isDeleted: false,
		});

		const response = await request(app)
			.get(`/api/files/${first._id}/versions`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(2);
		expect(response.body[0].isCurrent).toBe(false);
		expect(response.body[1].isCurrent).toBe(true);
	});

	it('POST /api/files/:id/restore-version copies specific version and creates new file doc', async () => {
		const user = await User.create({
			email: 'restore-version@example.com',
			passwordHash: 'password123',
			storageUsed: 200,
		});
		const token = signToken(user);

		const source = await File.create({
			userId: user._id,
			originalName: 'spec.pdf',
			s3Key: 'uploads/spec-current.pdf',
			s3VersionId: 'curr-v',
			mimeType: 'application/pdf',
			size: 50,
			isDeleted: false,
		});

		const response = await request(app)
			.post(`/api/files/${source._id}/restore-version`)
			.set('Authorization', `Bearer ${token}`)
			.send({ targetS3VersionId: 'older-v' });

		expect(response.status).toBe(201);
		expect(copyVersionToS3).toHaveBeenCalledWith(source.s3Key, 'older-v', expect.stringContaining(`uploads/${user._id}/`));
		expect(response.body.parentFileId).toBe(source._id.toString());
		expect(response.body.s3VersionId).toBe('restored-version-id');

		const updatedUser = await User.findById(user._id);
		expect(updatedUser.storageUsed).toBe(250);
	});
});

