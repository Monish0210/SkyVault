const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const storageQuotaMiddleware = require('../middleware/storageQuota');
const File = require('../models/File');
const User = require('../models/User');
const { uploadToS3 } = require('../services/s3Service');

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 100 * 1024 * 1024,
	},
});

/**
 * Upload endpoint that stores binary in S3 and metadata in MongoDB.
 */
router.post('/upload', authMiddleware, storageQuotaMiddleware, upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			res.status(400).json({ error: 'No file provided' });
			return;
		}

		const userId = req.user.userId;
		const s3Key = `uploads/${userId}/${uuidv4()}-${req.file.originalname}`;
		const versionId = await uploadToS3(req.file.buffer, req.file.mimetype, s3Key);

		const fileDocument = await File.create({
			userId,
			originalName: req.file.originalname,
			s3Key,
			s3VersionId: versionId,
			mimeType: req.file.mimetype,
			size: req.file.size,
			parentFileId: null,
		});

		await User.findByIdAndUpdate(userId, { $inc: { storageUsed: req.file.size } });

		res.status(201).json(fileDocument);
	} catch (error) {
		if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
			res.status(413).json({ error: 'File size exceeds 100 MB limit' });
			return;
		}

		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

