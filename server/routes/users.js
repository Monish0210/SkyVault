const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const STORAGE_LIMIT_BYTES = 2147483648;

router.get('/me', authMiddleware, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('email storageUsed');

		if (!user) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		const storagePercent = +(user.storageUsed / STORAGE_LIMIT_BYTES * 100).toFixed(1);

		res.status(200).json({
			email: user.email,
			storageUsed: user.storageUsed,
			storageLimit: STORAGE_LIMIT_BYTES,
			storagePercent,
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

