export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (
  file,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
) => {
  return allowedTypes.includes(file.type);
};

export const validateScript = (script, maxLength = 1000) => {
  if (!script) return { valid: true };

  return {
    valid: script.length <= maxLength,
    error:
      script.length > maxLength
        ? `Script too long (max ${maxLength} characters)`
        : null,
  };
};
