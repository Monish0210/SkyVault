const jwt = require('jsonwebtoken');

/**
 * Validates Bearer token and attaches decoded payload to req.user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).json({ error: 'No token provided' });
		return;
	}

	const token = authHeader.slice(7).trim();

	if (!token) {
		res.status(401).json({ error: 'No token provided' });
		return;
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(401).json({ error: 'Invalid or expired token' });
	}
}

module.exports = authMiddleware;

