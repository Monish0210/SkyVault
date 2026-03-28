const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		sessionToken: process.env.AWS_SESSION_TOKEN,
	},
});

/**
 * Uploads a file buffer to S3 and returns the new object VersionId.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @param {string} s3Key
 * @returns {Promise<string | null>}
 */
async function uploadToS3(buffer, mimeType, s3Key) {
	const command = new PutObjectCommand({
		Bucket: process.env.S3_BUCKET_NAME,
		Key: s3Key,
		Body: buffer,
		ContentType: mimeType,
	});

	const result = await s3Client.send(command);
	return result.VersionId ?? null;
}

/**
 * Deletes an object from S3.
 * @param {string} s3Key
 * @returns {Promise<void>}
 */
async function deleteFromS3(s3Key) {
	const command = new DeleteObjectCommand({
		Bucket: process.env.S3_BUCKET_NAME,
		Key: s3Key,
	});

	await s3Client.send(command);
}

/**
 * Creates a presigned download URL for an S3 object.
 * @param {string} s3Key
 * @param {number} expirySeconds
 * @returns {Promise<string>}
 */
async function getPresignedUrl(s3Key, expirySeconds) {
	const command = new GetObjectCommand({
		Bucket: process.env.S3_BUCKET_NAME,
		Key: s3Key,
	});

	return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
}

/**
 * Restores a previous S3 object version by copying it to a new key.
 * @param {string} sourceKey
 * @param {string} targetS3VersionId
 * @param {string} destinationKey
 * @returns {Promise<string | null>}
 */
async function copyVersionToS3(sourceKey, targetS3VersionId, destinationKey) {
	const copySource = `${process.env.S3_BUCKET_NAME}/${sourceKey}?versionId=${targetS3VersionId}`;
	const command = new CopyObjectCommand({
		Bucket: process.env.S3_BUCKET_NAME,
		Key: destinationKey,
		CopySource: copySource,
	});

	const result = await s3Client.send(command);
	return result.VersionId ?? null;
}

module.exports = {
	uploadToS3,
	deleteFromS3,
	getPresignedUrl,
	copyVersionToS3,
};

