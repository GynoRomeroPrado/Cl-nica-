# Database Documentation

## Overview

This directory contains the database schema, migrations, and seed data for the Health & Fitness App.

## Database: PostgreSQL 16+

We use PostgreSQL with Supabase for the following features:
- Row Level Security (RLS)
- Realtime subscriptions
- Built-in authentication
- RESTful API auto-generation
- pg_cron for scheduled jobs

## Setup Instructions

### Option 1: Supabase (Recommended for MVP)

1. Create a Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Run the schema:

```bash
# Using Supabase CLI
supabase db reset
supabase db push

# Or via SQL Editor in Supabase Dashboard
# Copy and paste contents of schema.sql
```

4. Run seed data:

```bash
supabase db seed
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL 16+
2. Create database:

```bash
createdb healthapp
```

3. Run schema:

```bash
psql -U postgres -d healthapp -f schema.sql
```

4. Run seeds:

```bash
psql -U postgres -d healthapp -f seeds/01_sample_exercises.sql
```

## Schema Overview

### Core Tables

**Users & Auth**
- `users` - User profiles
- `user_settings` - User preferences
- `user_stats` - Gamification stats

**Workouts**
- `exercises` - Exercise library (1,000+ from ExerciseDB)
- `workouts` - Workout sessions
- `workout_exercises` - Exercises in a workout
- `workout_sets` - Individual sets
- `workout_templates` - Saved workout templates

**Medications**
- `medications` - User medications/supplements
- `medication_schedules` - When to take meds
- `medication_logs` - Intake tracking
- `drug_interactions` - Drug interaction database

**Content**
- `health_articles` - Health news and research
- `article_bookmarks` - User saved articles
- `daily_quotes` - Motivational quotes

**Gamification**
- `achievements` - Achievement definitions
- `user_achievements` - Unlocked achievements
- `leaderboard_entries` - Weekly leaderboards

**Social**
- `friendships` - Friend connections
- `workout_comments` - Social engagement

**Compliance**
- `audit_logs` - GDPR compliance tracking

## Materialized Views

**`weekly_exercise_progress`**
- Aggregates workout data by exercise per week
- Refreshes daily at 2 AM
- Used for progress tracking and ML features

**`medication_adherence_summary`**
- Calculates adherence rates per medication
- Refreshes daily at 2 AM
- Used for health insights

## Indexes

All critical queries are indexed:
- User workouts by date
- Medication schedules
- Exercise searches by body part/equipment
- Leaderboard rankings

## Row Level Security

Enabled on:
- `workouts` - Users only see own workouts (unless shared)
- `medications` - Private to user
- `medication_logs` - Private to user
- `user_settings` - Private to user

## Triggers

**`update_user_stats_after_workout`**
- Auto-updates user stats when workout completed
- Calculates streaks
- Updates total volume/workouts

**`create_user_stats`**
- Auto-creates stats and settings on user signup

**`update_medication_adherence`**
- Recalculates adherence rate on med log

## Scheduled Jobs (pg_cron)

- **2 AM daily** - Refresh materialized views
- **3 AM Sunday** - Clean old audit logs (90+ days)

## Migrations

Migrations are numbered sequentially:
- `001_initial_schema.sql`
- `002_add_social_features.sql`
- etc.

To create a new migration:

```bash
# Create file
touch migrations/00X_description.sql

# Apply migration
psql -U postgres -d healthapp -f migrations/00X_description.sql
```

## Seed Data

Seed files in `seeds/` directory:
- `01_sample_exercises.sql` - ~20 popular exercises for testing
- `02_achievements.sql` - Default achievement definitions (already in schema.sql)

For production, exercises are synced from ExerciseDB API.

## Backup & Recovery

### Backup

```bash
# Full backup
pg_dump -U postgres healthapp > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U postgres --schema-only healthapp > schema_backup.sql

# Data only
pg_dump -U postgres --data-only healthapp > data_backup.sql
```

### Restore

```bash
psql -U postgres healthapp < backup_20240101.sql
```

## Performance Tuning

Key optimizations:
- GIN indexes on array fields (body_parts, equipment)
- Partial indexes on active records
- Materialized views for complex aggregations
- Generated columns for computed values (volume)

## Security Checklist

- ✅ Row Level Security enabled
- ✅ Sensitive fields encrypted (see backend encryption service)
- ✅ Audit logging for GDPR compliance
- ✅ No direct user access to raw tables (use RLS policies)
- ✅ Prepared statements (SQL injection prevention)
- ✅ Rate limiting at application level

## Common Queries

### Get user's workout history
```sql
SELECT w.*, COUNT(we.workout_exercise_id) as exercise_count
FROM workouts w
LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
WHERE w.user_id = $1
GROUP BY w.workout_id
ORDER BY w.workout_date DESC
LIMIT 20;
```

### Get medication schedule for today
```sql
SELECT m.name, m.dosage, ms.time, ms.meal_timing
FROM medications m
JOIN medication_schedules ms ON m.med_id = ms.med_id
WHERE m.user_id = $1
  AND ms.enabled = true
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
ORDER BY ms.time;
```

### Get user's current streak
```sql
SELECT current_streak, longest_streak, last_workout_date
FROM user_stats
WHERE user_id = $1;
```

## Troubleshooting

### Views not refreshing
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_exercise_progress;
REFRESH MATERIALIZED VIEW CONCURRENTLY medication_adherence_summary;

-- Check pg_cron jobs
SELECT * FROM cron.job;
```

### RLS blocking queries
```sql
-- Temporarily disable RLS for debugging (DEV ONLY)
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;

-- Re-enable
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
```

### Check table sizes
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Contact

For database issues or questions:
- Backend Lead: backend@healthapp.com
- DBA: dba@healthapp.com
