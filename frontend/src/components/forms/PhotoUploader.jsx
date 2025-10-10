import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLanguage } from '../../contexts/LanguageContext';
import apiService from '../../services/api';
import styles from './PhotoUploader.module.css';

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
          const { uploads } = await apiService.generateUploadUrls(
            file.type || 'image/jpeg',
            1
          );
          const upload = uploads[0];

          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          await apiService.uploadToS3(upload.uploadUrl, file);

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
    maxSize: 10 * 1024 * 1024,
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
    <div className={styles.uploader}>
      <div
        {...getRootProps()}
        className={`
          ${styles.dropzone}
          ${isDragActive ? styles.dropzoneActive : ''}
          ${
            uploading || photos.length >= maxPhotos
              ? styles.dropzoneDisabled
              : ''
          }
        `}
      >
        <input {...getInputProps()} />
        <div className={styles.dropzoneContent}>
          <div className={styles.dropzoneIcon}>📸</div>
          {isDragActive ? (
            <p className={styles.dropzoneTitle}>
              {t('frontend:create_request.uploading')}
            </p>
          ) : (
            <>
              <p className={styles.dropzoneTitle}>
                {t('frontend:create_request.photos_hint')}
              </p>
              <p className={styles.dropzoneSubtitle}>
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

      {photos.length > 0 && (
        <div className={styles.photosGrid}>
          {photos.map((photo, index) => (
            <div key={index} className={styles.photoItem}>
              <img
                src={photo.preview}
                alt={`Pet ${index + 1}`}
                className={styles.photoImage}
              />
              <button
                onClick={() => removePhoto(index)}
                className={styles.removeButton}
              >
                ×
              </button>
              {uploadProgress[photo.file.name] !== undefined &&
                uploadProgress[photo.file.name] < 100 && (
                  <div className={styles.progressOverlay}>
                    <div className={styles.progressText}>
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
