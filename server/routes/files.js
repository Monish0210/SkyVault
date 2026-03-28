const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const storageQuotaMiddleware = require('../middleware/storageQuota');
const File = require('../models/File');
const User = require('../models/User');
const { uploadToS3, deleteFromS3, getPresignedUrl } = require('../services/s3Service');

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

router.get('/', authMiddleware, async (req, res) => {
	try {
		const files = await File.find({
			userId: req.user.userId,
			isDeleted: false,
		}).sort({ createdAt: -1 });

		res.status(200).json(files);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/trash', authMiddleware, async (req, res) => {
	try {
		const files = await File.find({
			userId: req.user.userId,
			isDeleted: true,
		}).sort({ createdAt: -1 });

		res.status(200).json(files);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/:id/download', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		const expirySeconds = 3600;
		const url = await getPresignedUrl(file.s3Key, expirySeconds);

		res.status(200).json({
			url,
			filename: file.originalName,
			expiresIn: expirySeconds,
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.delete('/:id', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
			isDeleted: false,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		file.isDeleted = true;
		file.deletedAt = new Date();
		await file.save();

		await User.findByIdAndUpdate(req.user.userId, { $inc: { storageUsed: -file.size } });

		res.status(200).json(file);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.post('/:id/restore', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
			isDeleted: true,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		file.isDeleted = false;
		file.deletedAt = null;
		await file.save();

		await User.findByIdAndUpdate(req.user.userId, { $inc: { storageUsed: file.size } });

		res.status(200).json(file);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.delete('/:id/permanent', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		if (!file.isDeleted) {
			res.status(400).json({ error: 'File must be in trash before permanent deletion' });
			return;
		}

		await deleteFromS3(file.s3Key);
		await File.deleteOne({ _id: file._id });

		res.status(200).json({ message: 'File permanently deleted' });
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;

