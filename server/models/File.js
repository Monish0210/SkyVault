const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	originalName: {
		type: String,
		required: true,
		trim: true,
	},
	s3Key: {
		type: String,
		required: true,
	},
	s3VersionId: {
		type: String,
		default: null,
	},
	mimeType: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		required: true,
		min: 0,
	},
	parentFileId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'File',
		default: null,
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
	deletedAt: {
		type: Date,
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

/**
 * Returns total non-deleted storage consumed by a user in bytes.
 * @param {string | import('mongoose').Types.ObjectId} userId
 * @returns {Promise<number>}
 */
fileSchema.statics.getUserStorageUsed = async function getUserStorageUsed(userId) {
	const results = await this.aggregate([
		{
			$match: {
				userId: new mongoose.Types.ObjectId(userId),
				isDeleted: false,
			},
		},
		{
			$group: {
				_id: '$userId',
				totalSize: { $sum: '$size' },
			},
		},
	]);

	return results[0]?.totalSize ?? 0;
};

module.exports = mongoose.model('File', fileSchema);

