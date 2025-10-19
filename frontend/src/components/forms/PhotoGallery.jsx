import React from 'react';
import styles from './PhotoGallery.module.css';

const PhotoGallery = ({ photos = [] }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  const validPhotos = photos.filter((photo) => photo.url);

  if (validPhotos.length === 0) {
    return null;
  }

  return (
    <div className={styles.gallery}>
      {validPhotos.map((photo, index) => (
        <div key={photo.key} className={styles.photoItem}>
          <img src={photo.url} alt={`Photo ${index + 1}`} loading="lazy" />
        </div>
      ))}
    </div>
  );
};

export default PhotoGallery;
