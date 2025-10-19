
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ 
BEGIN
    -- User roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
    
    -- User languages
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_language') THEN
        CREATE TYPE user_language AS ENUM ('ru', 'en');
    END IF;
    
    -- Request status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('created', 'paid', 'in_progress', 'completed', 'cancelled');
    END IF;
    
    -- Payment status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash TEXT,
    language user_language DEFAULT 'en',
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT users_telegram_or_email CHECK (
        (telegram_id IS NOT NULL) OR (email IS NOT NULL)
    )
);

-- Create templates table (WITHOUT duplicate columns)
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    duration_seconds INTEGER NOT NULL DEFAULT 30,
    max_photos INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT templates_positive_duration CHECK (duration_seconds > 0),
    CONSTRAINT templates_positive_max_photos CHECK (max_photos > 0),
    CONSTRAINT templates_reasonable_duration CHECK (duration_seconds <= 300)
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photos JSONB NOT NULL,
    script TEXT,
    template_id UUID REFERENCES templates(id),
    status request_status DEFAULT 'created',
    payment_status payment_status DEFAULT 'pending',
    payment_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    video_url VARCHAR(500),
    admin_notes TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT requests_positive_amount CHECK (amount >= 0),
    CONSTRAINT requests_max_photos CHECK (jsonb_array_length(photos) <= 10)
);

-- Create translations table (NEW - for i18n)
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    translation_key VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL,
    translation_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_entity_check CHECK (
        (entity_id IS NULL AND entity_type IN ('system', 'email', 'notification')) OR
        (entity_id IS NOT NULL AND entity_type IN ('template', 'category'))
    ),
    
    CONSTRAINT unique_translation UNIQUE (entity_type, entity_id, translation_key, language)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON templates(sort_order);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_payment_status ON requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_template_id ON requests(template_id);

CREATE INDEX IF NOT EXISTS idx_translations_entity_type ON translations(entity_type);
CREATE INDEX IF NOT EXISTS idx_translations_entity_id ON translations(entity_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_key_language ON translations(translation_key, language);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at 
    BEFORE UPDATE ON translations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO users (
    id, email, username, first_name, last_name, password_hash, role, is_active
) VALUES (
    uuid_generate_v4(),
    'admin@aipetvideo.com',
    'admin',
    'System',
    'Administrator',
    '$2b$12$LQv3c1yqBWVH.5LnU1z8e.E7y6c6t7b8n9z0c1d2e3f4g5h6i7j8k',
    'admin',
    TRUE
);

-- Insert default templates with translations
INSERT INTO templates (name, description, category, duration_seconds, max_photos, sort_order) VALUES
('Happy Pet', 'A joyful video of your pet playing', 'general', 30, 5, 1),
('Sleepy Time', 'A peaceful video of your pet resting', 'general', 25, 3, 2),
('Adventure Time', 'Your pet on an epic adventure', 'adventure', 35, 7, 3),
('Birthday Party', 'Celebrate your pet birthday', 'celebration', 20, 4, 4);

-- Insert template translations
INSERT INTO translations (entity_type, entity_id, translation_key, language, translation_text)
SELECT 
    'template',
    t.id,
    'name',
    'en',
    t.name
FROM templates t
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, translation_key, language, translation_text)
SELECT 
    'template',
    t.id,
    'description',
    'en',
    t.description
FROM templates t
WHERE t.description IS NOT NULL;

-- Insert Russian template translations
INSERT INTO translations (entity_type, entity_id, translation_key, language, translation_text) VALUES
-- Happy Pet Russian
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Happy Pet'), 'name', 'ru', 'Счастливый питомец'),
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Happy Pet'), 'description', 'ru', 'Радостное видео с игрой вашего питомца'),

-- Sleepy Time Russian
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Sleepy Time'), 'name', 'ru', 'Время сна'),
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Sleepy Time'), 'description', 'ru', 'Спокойное видео с отдыхающим питомцем'),

-- Adventure Time Russian
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Adventure Time'), 'name', 'ru', 'Время приключений'),
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Adventure Time'), 'description', 'ru', 'Ваш питомец в эпических приключениях'),

-- Birthday Party Russian
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Birthday Party'), 'name', 'ru', 'День рождения'),
((SELECT 'template'), (SELECT id FROM templates WHERE name = 'Birthday Party'), 'description', 'ru', 'Празднуем день рождения питомца');

-- Insert system translations
INSERT INTO translations (entity_type, entity_id, translation_key, language, translation_text) VALUES
-- System texts
('system', NULL, 'welcome', 'en', '🐾 Welcome to AI Pet Video!\n\nI''ll help you create amazing AI-generated videos with your pet photos.\n\nChoose your language:'),
('system', NULL, 'welcome', 'ru', '🐾 Добро пожаловать в AI Pet Video!\n\nЯ помогу вам создать удивительные AI-видео с фотографиями ваших питомцев.\n\nВыберите язык:'),
('system', NULL, 'welcome_back', 'en', '🐾 Welcome back, {name}!\n\nWhat would you like to do?'),
('system', NULL, 'welcome_back', 'ru', '🐾 С возвращением, {name}!\n\nЧто хотите сделать?'),

-- Email subjects
('email', NULL, 'status_updated', 'en', 'AI Pet Video - Request Status Updated'),
('email', NULL, 'status_updated', 'ru', 'AI Pet Video - Статус заявки изменен'),

-- Status messages
('notification', NULL, 'status_paid', 'en', 'Your request has been paid and added to processing queue'),
('notification', NULL, 'status_paid', 'ru', 'Ваша заявка оплачена и добавлена в очередь обработки'),
('notification', NULL, 'status_in_progress', 'en', 'Your request is being processed'),
('notification', NULL, 'status_in_progress', 'ru', 'Ваша заявка взята в работу'),
('notification', NULL, 'status_completed', 'en', 'Your video is ready!'),
('notification', NULL, 'status_completed', 'ru', 'Ваше видео готово!')
ON CONFLICT DO NOTHING;

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Database schema created successfully with i18n support!';
    RAISE NOTICE '✓ Users table created';
    RAISE NOTICE '✓ Templates table created (without duplicate columns)';
    RAISE NOTICE '✓ Requests table created';
    RAISE NOTICE '✓ Translations table created';
    RAISE NOTICE '✓ Default data inserted';
END $$;