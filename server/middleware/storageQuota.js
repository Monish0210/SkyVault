const User = require('../models/User');

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Blocks requests when the authenticated user has reached the 2 GB quota.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function storageQuotaMiddleware(req, res, next) {
	try {
		const user = await User.findById(req.user.userId).select('storageUsed');

		if (!user) {
			res.status(401).json({ error: 'Invalid or expired token' });
			return;
		}

		if (user.storageUsed >= MAX_STORAGE_BYTES) {
			res.status(413).json({ error: 'Storage quota exceeded. Max 2 GB.' });
			return;
		}

		req.currentUser = user;
		next();
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = storageQuotaMiddleware;

