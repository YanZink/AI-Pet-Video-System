-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    name_ru VARCHAR(100),
    name_en VARCHAR(100),
    description_ru TEXT,
    description_en TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    duration_seconds INTEGER NOT NULL DEFAULT 30,
    max_photos INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT templates_positive_duration CHECK (duration_seconds > 0),
    CONSTRAINT templates_positive_max_photos CHECK (max_photos > 0),
    CONSTRAINT templates_reasonable_duration CHECK (duration_seconds <= 300) -- max 5 minutes
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON templates(sort_order);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO templates (name, name_en, name_ru, description_en, description_ru, category, duration_seconds, max_photos, sort_order) VALUES
('Happy Pet', 'Happy Pet', 'Счастливый питомец', 'A joyful video of your pet playing', 'Радостное видео с игрой вашего питомца', 'general', 30, 5, 1),
('Sleepy Time', 'Sleepy Time', 'Время сна', 'A peaceful video of your pet resting', 'Спокойное видео с отдыхающим питомцем', 'general', 25, 3, 2),
('Adventure Time', 'Adventure Time', 'Время приключений', 'Your pet on an epic adventure', 'Ваш питомец в эпических приключениях', 'adventure', 35, 7, 3),
('Birthday Party', 'Birthday Party', 'День рождения', 'Celebrate your pet birthday', 'Празднуем день рождения питомца', 'celebration', 20, 4, 4)
ON CONFLICT (name) DO NOTHING;