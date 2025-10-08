import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLanguage } from '../../contexts/LanguageContext';
import apiService from '../../services/api';

const PhotoUploader = ({ onPhotosUploaded, maxPhotos = 10 }) => {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (photos.length + acceptedFiles.length > maxPhotos) {
        alert(t('errors:max_photos_reached'));
        return;
      }

      setUploading(true);

      for (const file of acceptedFiles) {
        try {
          // Generate upload URL
          const { uploads } = await apiService.generateUploadUrls(
            file.type || 'image/jpeg',
            1
          );
          const upload = uploads[0];

          // Upload to S3
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          await apiService.uploadToS3(upload.uploadUrl, file);

          // Add to photos list
          setPhotos((prev) => [
            ...prev,
            {
              file,
              preview: URL.createObjectURL(file),
              s3Key: upload.key,
            },
          ]);

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error('Upload error:', error);
          alert(t('errors:upload_failed'));
        }
      }

      setUploading(false);
    },
    [photos.length, maxPhotos, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading || photos.length >= maxPhotos,
  });

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    if (onPhotosUploaded) {
      onPhotosUploaded(photos.map((p) => p.s3Key));
    }
  }, [photos, onPhotosUploaded]);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-white/30 hover:border-pink-500/50'
        } ${
          uploading || photos.length >= maxPhotos
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-white">
          <div className="text-5xl mb-4">📸</div>
          {isDragActive ? (
            <p className="text-lg">{t('frontend:create_request.uploading')}</p>
          ) : (
            <>
              <p className="text-lg mb-2">
                {t('frontend:create_request.photos_hint')}
              </p>
              <p className="text-sm text-white/60">
                {photos.length}/{maxPhotos}{' '}
                {t('frontend:create_request.photos_uploaded')
                  .replace('{count}', photos.length)
                  .replace('{max}', maxPhotos)
                  .replace(`${photos.length}/${maxPhotos} `, '')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Pet ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {uploadProgress[photo.file.name] !== undefined &&
                uploadProgress[photo.file.name] < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-sm">
                      {uploadProgress[photo.file.name]}%
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
