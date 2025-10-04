const express = require('express');
const fs = require('fs');
const path = require('path');
const { getGeneralRateLimit } = require('../middleware/rateLimit');

const uploadsRouter = express.Router();

// Ensure local upload dir exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Mock local upload endpoint to bypass S3 during early stages
uploadsRouter.put(
  '/mock/:key(*)',
  getGeneralRateLimit(),
  express.raw({ type: '*/*', limit: '25mb' }),
  async (req, res) => {
    try {
      const { key } = req.params;
      const uploadRoot = path.resolve(process.cwd(), 'storage', 'uploads');
      ensureDir(uploadRoot);

      const targetPath = path.join(uploadRoot, key);
      ensureDir(path.dirname(targetPath));

      const buffer = req.body;
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        return res.status(400).json({ message: 'Empty upload body' });
      }

      fs.writeFileSync(targetPath, buffer);

      res.status(200).json({
        message: 'File uploaded locally (mock) successfully',
        key,
        size: buffer.length,
        path: `/storage/uploads/${key}`,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to save file', error: error.message });
    }
  }
);

module.exports = uploadsRouter;
