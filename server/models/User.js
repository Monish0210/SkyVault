const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	passwordHash: {
		type: String,
		required: true,
	},
	storageUsed: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

userSchema.pre('save', async function hashPassword(next) {
	if (!this.isModified('passwordHash')) {
		next();
		return;
	}

	this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
	next();
});

/**
 * Compares a plaintext password with the stored hash.
 * @param {string} plaintext
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function comparePassword(plaintext) {
	return bcrypt.compare(plaintext, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

