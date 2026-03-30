const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
	fileId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'File',
		required: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	presignedUrl: {
		type: String,
		required: true,
	},
	versionId: {
		type: String,
		default: null,
	},
	expiresAt: {
		type: Date,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

shareSchema.index({ expiresAt: 1, fileId: 1 });

module.exports = mongoose.model('Share', shareSchema);

