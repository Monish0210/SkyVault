const express = require('express');
const request = require('supertest');

jest.mock('../utils/logger', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

const logger = require('../utils/logger');
const requestLogger = require('../middleware/requestLogger');

function createAppWithRoute(statusCode) {
	const app = express();
	app.use(requestLogger);
	app.get('/test', (req, res) => {
		res.status(statusCode).json({ ok: statusCode < 400 });
	});
	return app;
}

describe('requestLogger middleware', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('200 response calls logger.info', async () => {
		const app = createAppWithRoute(200);

		await request(app).get('/test').set('User-Agent', 'jest-test-agent/1.0');

		expect(logger.info).toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('404 response calls logger.warn', async () => {
		const app = createAppWithRoute(404);

		await request(app).get('/test').set('User-Agent', 'jest-test-agent/1.0');

		expect(logger.warn).toHaveBeenCalled();
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('responseTimeMs is a number in logged object', async () => {
		const app = createAppWithRoute(200);

		await request(app).get('/test').set('User-Agent', 'jest-test-agent/1.0');

		const completionCall = logger.info.mock.calls.find(
			([arg]) => arg && arg.message === 'Request completed'
		);

		expect(completionCall).toBeDefined();
		expect(completionCall[0]).toEqual(
			expect.objectContaining({
				responseTimeMs: expect.any(Number),
			})
		);
	});
});

