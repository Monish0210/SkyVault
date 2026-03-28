const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const storageQuotaMiddleware = require('../middleware/storageQuota');
const File = require('../models/File');
const Share = require('../models/Share');
const User = require('../models/User');
const { uploadToS3, deleteFromS3, getPresignedUrl, copyVersionToS3 } = require('../services/s3Service');

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
		const { parentFileId } = req.query;
		let resolvedParentFileId = null;

		if (parentFileId) {
			const parentFile = await File.findOne({
				_id: parentFileId,
				userId,
			});

			if (!parentFile) {
				res.status(404).json({ error: 'Parent file not found' });
				return;
			}

			resolvedParentFileId = parentFile._id;
		}

		const s3Key = `uploads/${userId}/${uuidv4()}-${req.file.originalname}`;
		const versionId = await uploadToS3(req.file.buffer, req.file.mimetype, s3Key);

		const fileDocument = await File.create({
			userId,
			originalName: req.file.originalname,
			s3Key,
			s3VersionId: versionId,
			mimeType: req.file.mimetype,
			size: req.file.size,
			parentFileId: resolvedParentFileId,
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

router.get('/:id/versions', authMiddleware, async (req, res) => {
	try {
		const sourceFile = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
			isDeleted: false,
		});

		if (!sourceFile) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		const versions = await File.find({
			userId: req.user.userId,
			originalName: sourceFile.originalName,
			isDeleted: false,
		}).sort({ createdAt: 1 });

		const newestVersionId = versions.length ? versions[versions.length - 1]._id.toString() : null;
		const payload = versions.map((version) => ({
			...version.toObject(),
			isCurrent: version._id.toString() === newestVersionId,
		}));

		res.status(200).json(payload);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.post('/:id/restore-version', authMiddleware, storageQuotaMiddleware, async (req, res) => {
	try {
		const { targetS3VersionId } = req.body;

		if (!targetS3VersionId) {
			res.status(400).json({ error: 'targetS3VersionId is required' });
			return;
		}

		const originalFile = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
			isDeleted: false,
		});

		if (!originalFile) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		const restoredS3Key = `uploads/${req.user.userId}/${uuidv4()}-restored-${originalFile.originalName}`;
		const newVersionId = await copyVersionToS3(originalFile.s3Key, targetS3VersionId, restoredS3Key);

		const restoredFile = await File.create({
			userId: req.user.userId,
			originalName: originalFile.originalName,
			s3Key: restoredS3Key,
			s3VersionId: newVersionId,
			mimeType: originalFile.mimeType,
			size: originalFile.size,
			parentFileId: originalFile._id,
			isDeleted: false,
			deletedAt: null,
		});

		await User.findByIdAndUpdate(req.user.userId, { $inc: { storageUsed: originalFile.size } });

		res.status(201).json(restoredFile);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.post('/:id/share', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		const expiresInSeconds = 3600;
		const shareUrl = await getPresignedUrl(file.s3Key, expiresInSeconds);
		const expiresAt = new Date(Date.now() + 3600000);

		await Share.create({
			fileId: file._id,
			createdBy: req.user.userId,
			presignedUrl: shareUrl,
			expiresAt,
		});

		res.status(201).json({
			shareUrl,
			expiresAt,
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/:id/shares', authMiddleware, async (req, res) => {
	try {
		const file = await File.findOne({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!file) {
			res.status(404).json({ error: 'File not found' });
			return;
		}

		const shares = await Share.find({
			fileId: file._id,
			expiresAt: { $gt: new Date() },
		}).sort({ createdAt: -1 });

		res.status(200).json(shares);
	} catch (error) {
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

