import { useState } from 'react';
import apiService from '../services/api';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFiles = async (files, folder = 'photos') => {
    if (!files || files.length === 0) return { success: false };

    setUploading(true);
    const uploaded = [];

    try {
      // Generate upload URLs per-file using its mime type
      const uploads = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { uploads: single } = await apiService.generateUploadUrls(
          file.type || 'image/jpeg',
          1
        );
        uploads.push(single[0]);
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const upload = uploads[i];

        setProgress((prev) => ({ ...prev, [file.name]: 0 }));

        await apiService.uploadToS3(upload.uploadUrl, file);

        setProgress((prev) => ({ ...prev, [file.name]: 100 }));

        uploaded.push({
          key: upload.key,
          file,
          preview: URL.createObjectURL(file),
        });
      }

      setUploadedFiles((prev) => [...prev, ...uploaded]);

      return {
        success: true,
        files: uploaded,
        keys: uploaded.map((u) => u.key),
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setUploadedFiles([]);
    setProgress({});
  };

  return {
    uploading,
    progress,
    uploadedFiles,
    uploadFiles,
    removeFile,
    reset,
  };
};
