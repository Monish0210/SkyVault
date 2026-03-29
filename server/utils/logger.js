const { createLogger, format, transports } = require('winston');

const { combine, timestamp, json, colorize, simple, errors } = format;

/**
 * Application logger.
 *
 * In production, logs are emitted as structured JSON to stdout so the
 * CloudWatch Agent can tail container logs and ship them to CloudWatch.
 */
const logger = createLogger({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	transports: [
		new transports.Console({
			format:
				process.env.NODE_ENV !== 'production'
					? combine(colorize(), timestamp(), simple())
					: combine(errors({ stack: true }), timestamp(), json()),
		}),
	],
});

module.exports = logger;

