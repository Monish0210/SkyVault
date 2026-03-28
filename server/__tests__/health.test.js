const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('mongoose', () => {
	const actualMongoose = jest.requireActual('mongoose');

	return {
		...actualMongoose,
		connect: jest.fn(),
	};
});

process.env.MONGODB_URI = 'mongodb://localhost:27017/skyvault-test';

mongoose.connect.mockResolvedValue({});

const app = require('../index');

describe('GET /api/health', () => {
	it('returns 200 and status ok', async () => {
		const response = await request(app).get('/api/health');

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('ok');
	});

	it('returns a timestamp field', async () => {
		const response = await request(app).get('/api/health');

		expect(response.body).toHaveProperty('timestamp');
	});
});

