const { v4: uuidv4 } = require('uuid');
const { s3, awsConfig } = require('../config/aws');
const logger = require('../utils/logger');
const { fileHelpers } = require('../utils/helpers');

class S3Service {
  constructor() {
    this.bucketName = awsConfig.s3.bucket;
    this.signedUrlExpires = awsConfig.s3.signedUrlExpires;
  }

  generatePresignedUploadUrl(contentType, folder = 'photos', filename = null) {
    try {
      const extension = contentType.split('/')[1];
      const key = filename || `${folder}/${uuidv4()}.${extension}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: this.signedUrlExpires,
        ContentType: contentType,
        ACL: 'private',
      };

      const uploadUrl = s3.getSignedUrl('putObject', params);

      return {
        uploadUrl,
        key,
        downloadUrl: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        contentType,
        expires: new Date(Date.now() + this.signedUrlExpires * 1000),
      };
    } catch (error) {
      logger.error('Error generating presigned upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  generatePresignedDownloadUrl(key, expiresIn = null) {
    try {
      const expires = expiresIn || this.signedUrlExpires;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expires,
      };

      const downloadUrl = s3.getSignedUrl('getObject', params);

      return {
        downloadUrl,
        key,
        expires: new Date(Date.now() + expires * 1000),
      };
    } catch (error) {
      logger.error('Error generating presigned download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async uploadFile(
    fileBuffer,
    originalFileName,
    contentType,
    folder = 'photos'
  ) {
    try {
      const fileName = fileHelpers.generateFileName(originalFileName);
      const key = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'private',
      };

      const result = await s3.upload(params).promise();

      return {
        key: result.Key,
        location: result.Location,
        size: fileBuffer.length,
        contentType,
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }
}

const s3Service = new S3Service();

module.exports = s3Service;
