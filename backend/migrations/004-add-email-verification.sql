-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster verification lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Update existing users to have email_verified = true (for backward compatibility)
UPDATE users SET email_verified = TRUE WHERE email IS NOT NULL;

-- Log the changes
DO $$ 
BEGIN
    RAISE NOTICE 'Email verification fields added to users table';
    RAISE NOTICE '✓ email_verified column added';
    RAISE NOTICE '✓ email_verification_token column added';
    RAISE NOTICE '✓ email_verification_sent_at column added';
    RAISE NOTICE '✓ Indexes created';
END $$;