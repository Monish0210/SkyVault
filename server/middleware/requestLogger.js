const logger = require('../utils/logger');

function requestLogger(req, res, next) {
	const startTime = Date.now();
	const userAgent = req.get('user-agent') || 'unknown';

	logger.info({
		message: 'Incoming request',
		method: req.method,
		url: req.originalUrl || req.url,
		userAgent,
	});

	res.on('finish', () => {
		const statusCode = res.statusCode;
		const payload = {
			message: 'Request completed',
			method: req.method,
			url: req.originalUrl || req.url,
			statusCode,
			responseTimeMs: Date.now() - startTime,
			userAgent,
		};

		if (statusCode >= 500) {
			logger.error(payload);
			return;
		}

		if (statusCode >= 400) {
			logger.warn(payload);
			return;
		}

		logger.info(payload);
	});

	next();
}

module.exports = requestLogger;

