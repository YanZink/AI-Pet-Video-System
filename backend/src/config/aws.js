const AWS = require('aws-sdk');
const logger = require('../utils/logger');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {
    Bucket: process.env.AWS_S3_BUCKET,
  },
});

const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
});

const testS3Connection = async () => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
    };

    await s3.headBucket(params).promise();
    logger.info('S3 bucket connection successful', {
      bucket: process.env.AWS_S3_BUCKET,
    });
    return true;
  } catch (error) {
    logger.error('S3 bucket connection failed:', error);
    return false;
  }
};

const testSESConnection = async () => {
  try {
    await ses
      .getIdentityVerificationAttributes({
        Identities: [process.env.FROM_EMAIL],
      })
      .promise();

    logger.info('SES connection successful', {
      fromEmail: process.env.FROM_EMAIL,
    });
    return true;
  } catch (error) {
    logger.error('SES connection failed:', error);
    return false;
  }
};

const awsConfig = {
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    signedUrlExpires: parseInt(process.env.S3_SIGNED_URL_EXPIRES) || 3600,
    uploadLimits: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
      maxFiles: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10,
    },
  },
  ses: {
    fromEmail: process.env.FROM_EMAIL,
    region: process.env.SES_REGION || process.env.AWS_REGION,
  },
};

module.exports = { s3, ses, testS3Connection, testSESConnection, awsConfig };
