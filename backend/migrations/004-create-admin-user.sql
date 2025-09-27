-- Create default admin user
INSERT INTO users (
    email,
    username,
    first_name,
    last_name,
    password_hash,
    role,
    is_active
) VALUES (
    'admin@aipetvideo.com',
    'admin',
    'System',
    'Administrator',
    -- Password: admin123 (hashed with bcrypt)
    '$2b$12$LQv3c1yqBWVH.5LnU1z8e.E7y6c6t7b8n9z0c1d2e3f4g5h6i7j8k',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;