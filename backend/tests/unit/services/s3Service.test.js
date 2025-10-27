const mockS3 = {
  getSignedUrl: jest.fn().mockImplementation((operation, params) => {
    return `https://mock-s3-url/${params.Key}`;
  }),
  upload: jest.fn().mockImplementation((params) => ({
    promise: jest.fn().mockResolvedValue({
      Key: params.Key,
      Location: `https://mock-bucket.s3.amazonaws.com/${params.Key}`,
    }),
  })),
  deleteObject: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  })),
  headBucket: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  })),
};

jest.mock('../../../src/config/aws', () => ({
  s3: mockS3,
  awsConfig: {
    s3: {
      bucket: 'test-bucket',
      signedUrlExpires: 3600,
    },
  },
}));

const s3Service = require('../../../src/services/s3Service');

describe('S3 Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned upload URL', () => {
      const contentType = 'image/jpeg';
      const folder = 'photos';

      const result = s3Service.generatePresignedUploadUrl(contentType, folder);

      expect(result.uploadUrl).toContain('https://mock-s3-url/');
      expect(result.key).toContain('photos/');
      expect(result.key).toContain('.jpeg');
      expect(result.contentType).toBe(contentType);
      expect(result.expires).toBeInstanceOf(Date);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
        'putObject',
        expect.objectContaining({
          Bucket: 'test-bucket',
          ContentType: contentType,
          ACL: 'private',
        })
      );
    });

    it('should generate URL with custom filename', () => {
      const contentType = 'image/png';
      const filename = 'custom-photo.png';

      s3Service.generatePresignedUploadUrl(contentType, 'photos', filename);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
        'putObject',
        expect.objectContaining({
          Key: expect.stringContaining('custom-photo.png'),
        })
      );
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL', () => {
      const key = 'photos/test-image.jpg';

      const result = s3Service.generatePresignedDownloadUrl(key);

      expect(result.downloadUrl).toContain('https://mock-s3-url/');
      expect(result.key).toBe(key);
      expect(result.expires).toBeInstanceOf(Date);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
        })
      );
    });

    it('should accept custom expiration time', () => {
      const key = 'photos/test-image.jpg';
      const expiresIn = 1800; // 30 minutes

      s3Service.generatePresignedDownloadUrl(key, expiresIn);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Expires: expiresIn,
        })
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload file to S3', async () => {
      const fileBuffer = Buffer.from('test file content');
      const originalFileName = 'test.jpg';
      const contentType = 'image/jpeg';

      const result = await s3Service.uploadFile(
        fileBuffer,
        originalFileName,
        contentType
      );

      expect(result.key).toContain('photos/');
      expect(result.key).toContain('.jpg');
      expect(result.location).toContain(
        'https://mock-bucket.s3.amazonaws.com/'
      );
      expect(result.size).toBe(fileBuffer.length);
      expect(result.contentType).toBe(contentType);

      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Body: fileBuffer,
          ContentType: contentType,
          ACL: 'private',
        })
      );
    });

    it('should upload file to custom folder', async () => {
      const fileBuffer = Buffer.from('test content');
      const originalFileName = 'doc.pdf';
      const contentType = 'application/pdf';

      await s3Service.uploadFile(
        fileBuffer,
        originalFileName,
        contentType,
        'documents'
      );

      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringContaining('documents/'),
        })
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      const key = 'photos/to-delete.jpg';

      const result = await s3Service.deleteFile(key);

      expect(result).toBe(true);
      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });
    });

    it('should handle delete errors', async () => {
      const key = 'photos/nonexistent.jpg';
      mockS3.deleteObject.mockImplementationOnce(() => ({
        promise: jest.fn().mockRejectedValue(new Error('File not found')),
      }));

      await expect(s3Service.deleteFile(key)).rejects.toThrow(
        'Failed to delete file'
      );
    });
  });
});
