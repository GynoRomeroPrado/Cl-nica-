-- ============================================
-- HEALTH & FITNESS APP - DATABASE SCHEMA
-- PostgreSQL 16+ with Supabase Extensions
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- MÓDULO USUARIOS Y AUTENTICACIÓN
-- ============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    date_of_birth DATE,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    gender VARCHAR(20),
    fitness_goal VARCHAR(50), -- 'strength', 'hypertrophy', 'endurance', 'weight_loss'
    experience_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    preferred_language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50),
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium'
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    workout_reminder_time TIME,
    weekly_goal_workouts INT DEFAULT 3,
    units_system VARCHAR(10) DEFAULT 'metric', -- 'metric', 'imperial'
    privacy_share_workouts BOOLEAN DEFAULT false,
    privacy_share_progress BOOLEAN DEFAULT false
);

-- ============================================
-- MÓDULO EJERCICIOS Y ENTRENAMIENTO
-- ============================================
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100), -- ExerciseDB ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT[],
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    gif_url VARCHAR(500),
    equipment TEXT[], -- ['barbell', 'bench']
    body_parts TEXT[], -- ['chest', 'shoulders', 'triceps']
    target_muscles TEXT[], -- ['pectoralis-major']
    secondary_muscles TEXT[],
    difficulty VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    category VARCHAR(50), -- 'strength', 'cardio', 'flexibility'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workouts (
    workout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    workout_date TIMESTAMP NOT NULL,
    workout_type VARCHAR(50), -- 'strength', 'cardio', 'mixed'
    duration_minutes INT,
    total_volume DECIMAL(10,2), -- kg * reps sumados
    calories_burned INT,
    avg_heart_rate INT,
    notes TEXT,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workout_exercises (
    workout_exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(workout_id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(exercise_id),
    exercise_order INT,
    sets_completed INT,
    notes TEXT
);

CREATE TABLE workout_sets (
    set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID REFERENCES workout_exercises(workout_exercise_id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    weight_kg DECIMAL(6,2),
    reps INT,
    reps_in_reserve INT, -- RIR: 0-5
    duration_seconds INT, -- Para cardio/planks
    distance_meters DECIMAL(8,2), -- Para running/rowing
    rest_seconds INT,
    completed BOOLEAN DEFAULT true,
    volume DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(weight_kg, 0) * COALESCE(reps, 0)) STORED
);

CREATE TABLE workout_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    exercises JSONB, -- Array de {exercise_id, sets, reps, rest}
    is_public BOOLEAN DEFAULT false,
    times_used INT DEFAULT 0
);

-- ============================================
-- MÓDULO MEDICAMENTOS Y SUPLEMENTOS
-- ============================================
CREATE TABLE medications (
    med_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'prescription', 'supplement', 'vitamin', 'protein'
    dosage VARCHAR(100), -- '500mg', '2 scoops'
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    refill_date DATE,
    refill_quantity INT,
    refill_reminder_days INT DEFAULT 7,
    color_hex VARCHAR(7), -- Para UI: '#FF5733'
    icon VARCHAR(50), -- 'pill', 'capsule', 'liquid', 'powder'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medication_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    med_id UUID REFERENCES medications(med_id) ON DELETE CASCADE,
    time TIME NOT NULL,
    frequency VARCHAR(50), -- 'daily', 'weekly', 'every_x_days', 'as_needed'
    interval_days INT, -- Para 'every_x_days'
    days_of_week INT[], -- [1,2,3,4,5] = Mon-Fri, NULL = todos
    meal_timing VARCHAR(50), -- 'before_meal', 'with_meal', 'after_meal', 'empty_stomach', 'anytime'
    water_reminder BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    notification_sound VARCHAR(50) DEFAULT 'default',
    snooze_duration_minutes INT DEFAULT 10
);

CREATE TABLE medication_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    med_id UUID REFERENCES medications(med_id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES medication_schedules(schedule_id),
    scheduled_time TIMESTAMP NOT NULL,
    taken_time TIMESTAMP,
    status VARCHAR(20), -- 'taken', 'missed', 'skipped', 'snoozed'
    snooze_count INT DEFAULT 0,
    notes TEXT,
    photo_url VARCHAR(500), -- Opcional: foto del med tomado
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drug_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_a VARCHAR(255) NOT NULL,
    drug_b VARCHAR(255) NOT NULL,
    severity VARCHAR(20), -- 'major', 'moderate', 'minor'
    description TEXT,
    source VARCHAR(255), -- 'FDA', 'DrugBank', etc.
    UNIQUE(drug_a, drug_b)
);

-- ============================================
-- MÓDULO HEALTH CONTENT
-- ============================================
CREATE TABLE health_articles (
    article_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,
    source VARCHAR(255), -- 'PubMed', 'NewsAPI', 'Manual'
    source_url VARCHAR(1000),
    author VARCHAR(255),
    published_date DATE,
    credibility_score INT, -- 0-100
    category VARCHAR(50), -- 'nutrition', 'exercise', 'mental_health'
    image_url VARCHAR(500),
    read_time_minutes INT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_bookmarks (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    article_id UUID REFERENCES health_articles(article_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- ============================================
-- MÓDULO GAMIFICACIÓN
-- ============================================
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    total_workouts INT DEFAULT 0,
    total_volume_kg DECIMAL(12,2) DEFAULT 0,
    total_minutes INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_workout_date DATE,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    medications_taken_count INT DEFAULT 0,
    medications_adherence_rate DECIMAL(5,2) -- Porcentaje
);

CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'milestone', 'performance', 'consistency', 'social'
    icon_url VARCHAR(500),
    xp_reward INT,
    condition JSONB -- {type: 'workout_count', value: 100}
);

CREATE TABLE user_achievements (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(achievement_id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE leaderboard_entries (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    metric VARCHAR(50), -- 'total_volume', 'streak', 'xp'
    value DECIMAL(12,2),
    week_start DATE,
    rank INT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, metric, week_start)
);

-- ============================================
-- MÓDULO SOCIAL
-- ============================================
CREATE TABLE friendships (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20), -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE TABLE workout_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(workout_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MÓDULO QUOTES & MOTIVATION
-- ============================================
CREATE TABLE daily_quotes (
    quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_text TEXT NOT NULL,
    author VARCHAR(255),
    category VARCHAR(50), -- 'fitness', 'motivation', 'health'
    source VARCHAR(100), -- 'ZenQuotes', 'Manual'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_quote_favorites (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    quote_id UUID REFERENCES daily_quotes(quote_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, quote_id)
);

-- ============================================
-- AUDIT & COMPLIANCE
-- ============================================
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'DATA_EXPORT', 'ACCOUNT_DELETED', 'LOGIN', etc.
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES CRÍTICOS
-- ============================================

-- Workouts
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date DESC);
CREATE INDEX idx_workouts_completed ON workouts(user_id, completed) WHERE completed = true;
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_workout_sets_workout_ex ON workout_sets(workout_exercise_id);

-- Exercises
CREATE INDEX idx_exercises_body_parts ON exercises USING GIN(body_parts);
CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_category ON exercises(category);

-- Medications
CREATE INDEX idx_medications_user ON medications(user_id) WHERE end_date IS NULL OR end_date >= CURRENT_DATE;
CREATE INDEX idx_med_schedules_med ON medication_schedules(med_id) WHERE enabled = true;
CREATE INDEX idx_med_logs_scheduled ON medication_logs(scheduled_time DESC);
CREATE INDEX idx_med_logs_user_status ON medication_logs(med_id, status, scheduled_time DESC);

-- Health Articles
CREATE INDEX idx_articles_published ON health_articles(published_date DESC, credibility_score DESC);
CREATE INDEX idx_articles_category ON health_articles(category, published_date DESC);
CREATE INDEX idx_articles_source ON health_articles(source);

-- Gamification
CREATE INDEX idx_leaderboard_metric_week ON leaderboard_entries(metric, week_start, rank);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Social
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

-- Audit
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Workouts policies
CREATE POLICY "Users view own workouts" ON workouts
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS(
            SELECT 1 FROM user_settings
            WHERE user_id = workouts.user_id
            AND privacy_share_workouts = true
        )
    );

CREATE POLICY "Users insert own workouts" ON workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workouts" ON workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own workouts" ON workouts
    FOR DELETE USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users view own medications" ON medications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own medications" ON medications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own medications" ON medications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own medications" ON medications
    FOR DELETE USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users view own med logs" ON medication_logs
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM medications
            WHERE med_id = medication_logs.med_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own med logs" ON medication_logs
    FOR INSERT WITH CHECK (
        EXISTS(
            SELECT 1 FROM medications
            WHERE med_id = medication_logs.med_id
            AND user_id = auth.uid()
        )
    );

-- User settings policies
CREATE POLICY "Users manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- VISTAS MATERIALIZADAS
-- ============================================

-- Weekly exercise progress
CREATE MATERIALIZED VIEW weekly_exercise_progress AS
SELECT
    u.user_id,
    e.exercise_id,
    DATE_TRUNC('week', w.workout_date) as week_start,
    SUM(ws.volume) as total_volume,
    MAX(ws.weight_kg) as max_weight,
    AVG(ws.reps) as avg_reps,
    COUNT(DISTINCT w.workout_id) as workout_count
FROM users u
JOIN workouts w ON u.user_id = w.user_id
JOIN workout_exercises we ON w.workout_id = we.workout_id
JOIN exercises e ON we.exercise_id = e.exercise_id
JOIN workout_sets ws ON we.workout_exercise_id = ws.workout_exercise_id
WHERE w.completed = true
GROUP BY u.user_id, e.exercise_id, week_start;

CREATE INDEX idx_weekly_progress ON weekly_exercise_progress(user_id, exercise_id, week_start DESC);

-- Medication adherence view
CREATE MATERIALIZED VIEW medication_adherence_summary AS
SELECT
    m.user_id,
    m.med_id,
    m.name as medication_name,
    COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) as doses_taken,
    COUNT(CASE WHEN ml.status = 'missed' THEN 1 END) as doses_missed,
    COUNT(ml.log_id) as total_scheduled,
    ROUND(
        100.0 * COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) / NULLIF(COUNT(ml.log_id), 0),
        2
    ) as adherence_rate,
    MAX(ml.scheduled_time) as last_scheduled,
    MAX(CASE WHEN ml.status = 'taken' THEN ml.taken_time END) as last_taken
FROM medications m
LEFT JOIN medication_logs ml ON m.med_id = ml.med_id
WHERE m.end_date IS NULL OR m.end_date >= CURRENT_DATE
GROUP BY m.user_id, m.med_id, m.name;

CREATE INDEX idx_adherence_summary ON medication_adherence_summary(user_id, adherence_rate DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update user stats after workout
CREATE OR REPLACE FUNCTION update_user_stats_after_workout()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total workouts, volume, and minutes
    UPDATE user_stats
    SET
        total_workouts = total_workouts + 1,
        total_volume_kg = total_volume_kg + COALESCE(NEW.total_volume, 0),
        total_minutes = total_minutes + COALESCE(NEW.duration_minutes, 0),
        last_workout_date = NEW.workout_date::DATE
    WHERE user_id = NEW.user_id;

    -- Update streak
    WITH streak_calc AS (
        SELECT
            user_id,
            CASE
                WHEN last_workout_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
                WHEN last_workout_date = CURRENT_DATE THEN current_streak
                ELSE 1
            END as new_streak
        FROM user_stats
        WHERE user_id = NEW.user_id
    )
    UPDATE user_stats us
    SET
        current_streak = sc.new_streak,
        longest_streak = GREATEST(longest_streak, sc.new_streak)
    FROM streak_calc sc
    WHERE us.user_id = sc.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER INSERT ON workouts
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION update_user_stats_after_workout();

-- Function to auto-create user stats on user creation
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id) VALUES (NEW.user_id);
    INSERT INTO user_settings (user_id) VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_stats
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_stats();

-- Function to update medication adherence
CREATE OR REPLACE FUNCTION update_medication_adherence()
RETURNS TRIGGER AS $$
DECLARE
    adherence_rate DECIMAL(5,2);
BEGIN
    -- Calculate adherence rate for last 30 days
    SELECT
        ROUND(
            100.0 * COUNT(CASE WHEN status = 'taken' THEN 1 END) / NULLIF(COUNT(*), 0),
            2
        )
    INTO adherence_rate
    FROM medication_logs ml
    JOIN medications m ON ml.med_id = m.med_id
    WHERE m.user_id = (SELECT user_id FROM medications WHERE med_id = NEW.med_id)
    AND ml.scheduled_time >= CURRENT_DATE - INTERVAL '30 days';

    -- Update user stats
    UPDATE user_stats
    SET
        medications_taken_count = medications_taken_count + CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END,
        medications_adherence_rate = adherence_rate
    WHERE user_id = (SELECT user_id FROM medications WHERE med_id = NEW.med_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medication_adherence
AFTER INSERT ON medication_logs
FOR EACH ROW
EXECUTE FUNCTION update_medication_adherence();

-- ============================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================

-- Refresh materialized views daily at 2 AM
SELECT cron.schedule(
    'refresh-weekly-progress',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_exercise_progress'
);

SELECT cron.schedule(
    'refresh-adherence-summary',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY medication_adherence_summary'
);

-- Clean up old audit logs (keep 90 days)
SELECT cron.schedule(
    'cleanup-audit-logs',
    '0 3 * * 0',
    'DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL ''90 days'''
);

-- ============================================
-- SEED DATA - Default Achievements
-- ============================================

INSERT INTO achievements (code, name, description, category, xp_reward, condition) VALUES
('FIRST_WORKOUT', 'First Steps', 'Complete your first workout', 'milestone', 100, '{"type": "workout_count", "value": 1}'),
('WORKOUT_10', 'Getting Started', 'Complete 10 workouts', 'milestone', 250, '{"type": "workout_count", "value": 10}'),
('WORKOUT_50', 'Dedicated', 'Complete 50 workouts', 'milestone', 500, '{"type": "workout_count", "value": 50}'),
('WORKOUT_100', 'Century Club', 'Complete 100 workouts', 'milestone', 1000, '{"type": "workout_count", "value": 100}'),
('STREAK_7', 'Week Warrior', 'Maintain a 7-day workout streak', 'consistency', 300, '{"type": "streak", "value": 7}'),
('STREAK_30', 'Month Master', 'Maintain a 30-day workout streak', 'consistency', 1500, '{"type": "streak", "value": 30}'),
('STREAK_100', 'Unstoppable', 'Maintain a 100-day workout streak', 'consistency', 5000, '{"type": "streak", "value": 100}'),
('VOLUME_1000', 'Ton Lifter', 'Lift 1,000kg total volume in a single workout', 'performance', 500, '{"type": "workout_volume", "value": 1000}'),
('VOLUME_10000', 'Volume King', 'Lift 10,000kg total volume lifetime', 'performance', 2000, '{"type": "total_volume", "value": 10000}'),
('MED_PERFECT_WEEK', 'Medication Master', '100% medication adherence for 7 days', 'consistency', 200, '{"type": "med_adherence_streak", "value": 7}'),
('MED_PERFECT_MONTH', 'Health Champion', '100% medication adherence for 30 days', 'consistency', 1000, '{"type": "med_adherence_streak", "value": 30}'),
('EARLY_BIRD', 'Early Bird', 'Complete a workout before 6 AM', 'special', 150, '{"type": "workout_time", "before": "06:00"}'),
('NIGHT_OWL', 'Night Owl', 'Complete a workout after 10 PM', 'special', 150, '{"type": "workout_time", "after": "22:00"}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Main user accounts table with profile information';
COMMENT ON TABLE workouts IS 'Individual workout sessions logged by users';
COMMENT ON TABLE medications IS 'User medications and supplements tracking';
COMMENT ON TABLE medication_logs IS 'Detailed log of medication intake events';
COMMENT ON TABLE health_articles IS 'Curated health and fitness articles from various sources';
COMMENT ON TABLE achievements IS 'Gamification achievements users can unlock';
COMMENT ON TABLE user_stats IS 'Aggregated statistics for user progress and gamification';

COMMENT ON COLUMN medications.color_hex IS 'UI color for medication display';
COMMENT ON COLUMN workout_sets.reps_in_reserve IS 'RIR (Reps In Reserve): 0-5, indicates proximity to failure';
COMMENT ON COLUMN health_articles.credibility_score IS 'Score 0-100 based on source reputation and content quality';
