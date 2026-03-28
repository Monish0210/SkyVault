const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a 24h JWT for an authenticated user.
 * @param {{ _id: import('mongoose').Types.ObjectId, email: string }} user
 * @returns {string}
 */
function signToken(user) {
	return jwt.sign(
		{ userId: user._id.toString(), email: user.email },
		process.env.JWT_SECRET,
		{ expiresIn: '24h' }
	);
}

router.post('/register', async (req, res) => {
	const { email, password } = req.body;

	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
	const plaintextPassword = typeof password === 'string' ? password : '';

	if (!EMAIL_REGEX.test(normalizedEmail)) {
		res.status(400).json({ error: 'Invalid email format' });
		return;
	}

	if (plaintextPassword.length < 8) {
		res.status(400).json({ error: 'Password must be at least 8 characters long' });
		return;
	}

	try {
		const existingUser = await User.findOne({ email: normalizedEmail });

		if (existingUser) {
			res.status(409).json({ error: 'Email already registered' });
			return;
		}

		const user = new User({
			email: normalizedEmail,
			passwordHash: plaintextPassword,
		});

		await user.save();

		const token = signToken(user);

		res.status(201).json({
			token,
			user: {
				userId: user._id.toString(),
				email: user.email,
			},
		});
	} catch (error) {
		if (error?.code === 11000) {
			res.status(409).json({ error: 'Email already registered' });
			return;
		}

		res.status(500).json({ error: 'Internal server error' });
	}
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
	const plaintextPassword = typeof password === 'string' ? password : '';

	try {
		const user = await User.findOne({ email: normalizedEmail });

		if (!user) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		const isValidPassword = await user.comparePassword(plaintextPassword);

		if (!isValidPassword) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		const token = signToken(user);

		res.status(200).json({
			token,
			user: {
				userId: user._id.toString(),
				email: user.email,
			},
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

