const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/s3Service', () => ({
	uploadToS3: jest.fn().mockResolvedValue('mock-version-id'),
	deleteFromS3: jest.fn().mockResolvedValue(undefined),
	getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/presigned-url'),
}));

const { deleteFromS3, getPresignedUrl } = require('../services/s3Service');
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

async function createUser(email, storageUsed = 0) {
	return User.create({
		email,
		passwordHash: 'password123',
		storageUsed,
	});
}

async function createFile(userId, overrides = {}) {
	return File.create({
		userId,
		originalName: 'file.txt',
		s3Key: `uploads/${userId}/file.txt`,
		s3VersionId: 'v1',
		mimeType: 'text/plain',
		size: 100,
		parentFileId: null,
		isDeleted: false,
		deletedAt: null,
		...overrides,
	});
}

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.MONGODB_URI = mongoServer.getUri();
	process.env.JWT_SECRET = 'files-routes-test-secret';

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

describe('File management routes', () => {
	it('GET /api/files returns only latest non-deleted version per filename', async () => {
		const user = await createUser('list@example.com');
		const token = signToken(user);

		await createFile(user._id, {
			originalName: 'report.pdf',
			createdAt: new Date('2024-01-01T00:00:00.000Z'),
			isDeleted: false,
		});
		await createFile(user._id, {
			originalName: 'report.pdf',
			createdAt: new Date('2024-03-01T00:00:00.000Z'),
			isDeleted: false,
		});
		await createFile(user._id, {
			originalName: 'notes.txt',
			createdAt: new Date('2024-02-01T00:00:00.000Z'),
			isDeleted: false,
		});
		await createFile(user._id, {
			originalName: 'report.pdf',
			isDeleted: true,
			createdAt: new Date('2024-04-01T00:00:00.000Z'),
			deletedAt: new Date(),
		});

		const response = await request(app)
			.get('/api/files')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(2);
		expect(response.body[0].originalName).toBe('report.pdf');
		expect(response.body[0].createdAt).toBe('2024-03-01T00:00:00.000Z');
		expect(response.body[1].originalName).toBe('notes.txt');
	});

	it('GET /api/files/trash returns only deleted files', async () => {
		const user = await createUser('trash@example.com');
		const token = signToken(user);

		await createFile(user._id, { originalName: 'active.txt', isDeleted: false });
		await createFile(user._id, {
			originalName: 'deleted.txt',
			isDeleted: true,
			deletedAt: new Date(),
		});

		const response = await request(app)
			.get('/api/files/trash')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(1);
		expect(response.body[0].originalName).toBe('deleted.txt');
	});

	it('GET /api/files/:id/download returns presigned URL payload', async () => {
		const user = await createUser('download@example.com');
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'download.txt',
			s3Key: 'uploads/download-key.txt',
		});

		const response = await request(app)
			.get(`/api/files/${file._id}/download`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			url: 'https://example.com/presigned-url',
			filename: 'download.txt',
			expiresIn: 3600,
		});
		expect(getPresignedUrl).toHaveBeenCalledWith('uploads/download-key.txt', 3600, null);
	});

	it('GET /api/files/:id/download with versionId uses version-aware presigned URL', async () => {
		const user = await createUser('download-version@example.com');
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'download-version.txt',
			s3Key: 'uploads/download-version-key.txt',
			s3VersionId: 'version-123',
		});

		const response = await request(app)
			.get(`/api/files/${file._id}/download`)
			.query({ versionId: 'version-123' })
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(getPresignedUrl).toHaveBeenCalledWith('uploads/download-version-key.txt', 3600, 'version-123');
	});

	it('POST /api/files/:id/share with versionId stores versionId in Share', async () => {
		const user = await createUser('share-version@example.com');
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'share-version.txt',
			s3Key: 'uploads/share-version-key.txt',
			s3VersionId: 'version-456',
		});

		const response = await request(app)
			.post(`/api/files/${file._id}/share`)
			.send({ versionId: 'version-456' })
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(201);
		expect(getPresignedUrl).toHaveBeenCalledWith('uploads/share-version-key.txt', 3600, 'version-456');

		const savedShare = await Share.findOne({ fileId: file._id });
		expect(savedShare).not.toBeNull();
		expect(savedShare.versionId).toBe('version-456');
	});

	it('POST /api/files/:id/share without versionId stores null versionId', async () => {
		const user = await createUser('share-latest@example.com');
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'share-latest.txt',
			s3Key: 'uploads/share-latest-key.txt',
		});

		const response = await request(app)
			.post(`/api/files/${file._id}/share`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(201);
		expect(getPresignedUrl).toHaveBeenCalledWith('uploads/share-latest-key.txt', 3600, null);

		const savedShare = await Share.findOne({ fileId: file._id });
		expect(savedShare).not.toBeNull();
		expect(savedShare.versionId).toBeNull();
	});

	it('DELETE /api/files/:id soft deletes file and decrements storage', async () => {
		const user = await createUser('softdelete@example.com', 300);
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'soft-delete.txt',
			size: 120,
		});

		const response = await request(app)
			.delete(`/api/files/${file._id}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);

		const updatedFile = await File.findById(file._id);
		expect(updatedFile.isDeleted).toBe(true);
		expect(updatedFile.deletedAt).not.toBeNull();

		const updatedUser = await User.findById(user._id);
		expect(updatedUser.storageUsed).toBe(180);
	});

	it('POST /api/files/:id/restore restores file and increments storage', async () => {
		const user = await createUser('restore@example.com', 200);
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'restore.txt',
			size: 75,
			isDeleted: true,
			deletedAt: new Date(),
		});

		const response = await request(app)
			.post(`/api/files/${file._id}/restore`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);

		const updatedFile = await File.findById(file._id);
		expect(updatedFile.isDeleted).toBe(false);
		expect(updatedFile.deletedAt).toBeNull();

		const updatedUser = await User.findById(user._id);
		expect(updatedUser.storageUsed).toBe(275);
	});

	it('DELETE /api/files/:id/permanent deletes trashed file and calls S3 delete', async () => {
		const user = await createUser('permanent@example.com');
		const token = signToken(user);
		const file = await createFile(user._id, {
			originalName: 'permanent.txt',
			s3Key: 'uploads/permanent-key.txt',
			isDeleted: true,
			deletedAt: new Date(),
		});

		const response = await request(app)
			.delete(`/api/files/${file._id}/permanent`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('File permanently deleted');
		expect(deleteFromS3).toHaveBeenCalledWith('uploads/permanent-key.txt');

		const deletedFile = await File.findById(file._id);
		expect(deletedFile).toBeNull();
	});
});

