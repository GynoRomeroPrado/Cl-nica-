-- ============================================
-- SAMPLE EXERCISES SEED DATA
-- This is a subset of popular exercises for testing
-- In production, sync full ExerciseDB via API
-- ============================================

INSERT INTO exercises (external_id, name, description, instructions, gif_url, equipment, body_parts, target_muscles, secondary_muscles, difficulty, category) VALUES

-- Chest exercises
('bench-press-001', 'Barbell Bench Press', 'Compound exercise for chest, shoulders, and triceps',
    ARRAY['Lie on bench with feet flat on floor', 'Grip bar slightly wider than shoulders', 'Lower bar to mid-chest', 'Press up explosively', 'Repeat for desired reps'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/barbell-bench-press.gif',
    ARRAY['barbell', 'bench'],
    ARRAY['chest', 'shoulders', 'triceps'],
    ARRAY['pectoralis-major'],
    ARRAY['anterior-deltoid', 'triceps-brachii'],
    'intermediate', 'strength'),

('push-up-001', 'Push-Up', 'Bodyweight chest and triceps exercise',
    ARRAY['Start in plank position', 'Lower body until chest nearly touches floor', 'Push back up', 'Keep core tight throughout'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/push-up.gif',
    ARRAY['bodyweight'],
    ARRAY['chest', 'triceps', 'shoulders'],
    ARRAY['pectoralis-major'],
    ARRAY['triceps-brachii', 'anterior-deltoid'],
    'beginner', 'strength'),

('dumbbell-fly-001', 'Dumbbell Chest Fly', 'Isolation exercise for chest',
    ARRAY['Lie on bench with dumbbells above chest', 'Lower weights out to sides in arc motion', 'Keep slight bend in elbows', 'Squeeze chest to bring weights back up'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/dumbbell-fly.gif',
    ARRAY['dumbbell', 'bench'],
    ARRAY['chest'],
    ARRAY['pectoralis-major'],
    ARRAY['anterior-deltoid'],
    'intermediate', 'strength'),

-- Back exercises
('deadlift-001', 'Barbell Deadlift', 'King of compound exercises',
    ARRAY['Stand with feet hip-width apart', 'Grip bar outside knees', 'Keep back straight, chest up', 'Drive through heels to stand', 'Lower with control'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/deadlift.gif',
    ARRAY['barbell'],
    ARRAY['back', 'legs', 'glutes'],
    ARRAY['erector-spinae', 'latissimus-dorsi'],
    ARRAY['gluteus-maximus', 'hamstrings', 'quadriceps'],
    'advanced', 'strength'),

('pull-up-001', 'Pull-Up', 'Bodyweight back exercise',
    ARRAY['Hang from bar with overhand grip', 'Pull yourself up until chin over bar', 'Lower with control', 'Full range of motion'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/pull-up.gif',
    ARRAY['pull-up-bar'],
    ARRAY['back', 'biceps'],
    ARRAY['latissimus-dorsi'],
    ARRAY['biceps-brachii', 'rhomboids'],
    'intermediate', 'strength'),

('barbell-row-001', 'Barbell Bent-Over Row', 'Compound back exercise',
    ARRAY['Bend at hips with slight knee bend', 'Grip bar shoulder-width', 'Pull bar to lower chest', 'Squeeze shoulder blades', 'Lower with control'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/barbell-row.gif',
    ARRAY['barbell'],
    ARRAY['back'],
    ARRAY['latissimus-dorsi', 'rhomboids'],
    ARRAY['biceps-brachii', 'trapezius'],
    'intermediate', 'strength'),

-- Leg exercises
('squat-001', 'Barbell Back Squat', 'Foundational leg exercise',
    ARRAY['Bar on upper back', 'Feet shoulder-width apart', 'Descend by bending knees and hips', 'Go to parallel or below', 'Drive through heels to stand'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/squat.gif',
    ARRAY['barbell', 'squat-rack'],
    ARRAY['legs', 'glutes'],
    ARRAY['quadriceps', 'gluteus-maximus'],
    ARRAY['hamstrings', 'erector-spinae'],
    'intermediate', 'strength'),

('lunge-001', 'Dumbbell Lunges', 'Unilateral leg exercise',
    ARRAY['Hold dumbbells at sides', 'Step forward into lunge', 'Lower until back knee nearly touches floor', 'Push back to start', 'Alternate legs'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/dumbbell-lunge.gif',
    ARRAY['dumbbell'],
    ARRAY['legs', 'glutes'],
    ARRAY['quadriceps', 'gluteus-maximus'],
    ARRAY['hamstrings'],
    'beginner', 'strength'),

('leg-press-001', 'Leg Press', 'Machine-based leg exercise',
    ARRAY['Sit in machine with feet on platform', 'Lower weight by bending knees', 'Push through heels to extend legs', 'Do not lock knees at top'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/leg-press.gif',
    ARRAY['leg-press-machine'],
    ARRAY['legs'],
    ARRAY['quadriceps'],
    ARRAY['gluteus-maximus', 'hamstrings'],
    'beginner', 'strength'),

-- Shoulder exercises
('overhead-press-001', 'Barbell Overhead Press', 'Compound shoulder exercise',
    ARRAY['Stand with bar at shoulder height', 'Press bar overhead', 'Lock out arms at top', 'Lower with control to shoulders'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/overhead-press.gif',
    ARRAY['barbell'],
    ARRAY['shoulders', 'triceps'],
    ARRAY['deltoids'],
    ARRAY['triceps-brachii', 'trapezius'],
    'intermediate', 'strength'),

('lateral-raise-001', 'Dumbbell Lateral Raise', 'Shoulder isolation exercise',
    ARRAY['Stand with dumbbells at sides', 'Raise weights out to sides', 'Lead with elbows, not hands', 'Lower with control'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/lateral-raise.gif',
    ARRAY['dumbbell'],
    ARRAY['shoulders'],
    ARRAY['lateral-deltoid'],
    ARRAY['anterior-deltoid'],
    'beginner', 'strength'),

-- Arm exercises
('bicep-curl-001', 'Dumbbell Bicep Curl', 'Biceps isolation exercise',
    ARRAY['Stand with dumbbells at sides', 'Curl weights up', 'Keep elbows stationary', 'Squeeze at top', 'Lower with control'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/bicep-curl.gif',
    ARRAY['dumbbell'],
    ARRAY['biceps'],
    ARRAY['biceps-brachii'],
    ARRAY['brachialis'],
    'beginner', 'strength'),

('tricep-dip-001', 'Tricep Dips', 'Bodyweight triceps exercise',
    ARRAY['Support yourself on parallel bars', 'Lower body by bending elbows', 'Go until upper arms parallel to floor', 'Push back up'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/tricep-dips.gif',
    ARRAY['parallel-bars'],
    ARRAY['triceps', 'chest'],
    ARRAY['triceps-brachii'],
    ARRAY['pectoralis-major'],
    'intermediate', 'strength'),

-- Core exercises
('plank-001', 'Plank', 'Core stability exercise',
    ARRAY['Start in forearm plank position', 'Keep body in straight line', 'Engage core', 'Hold for time'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/plank.gif',
    ARRAY['bodyweight'],
    ARRAY['core'],
    ARRAY['rectus-abdominis', 'transverse-abdominis'],
    ARRAY['obliques'],
    'beginner', 'strength'),

('ab-crunch-001', 'Crunches', 'Abdominal exercise',
    ARRAY['Lie on back with knees bent', 'Hands behind head', 'Curl upper body up', 'Squeeze abs', 'Lower with control'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/crunch.gif',
    ARRAY['bodyweight'],
    ARRAY['core'],
    ARRAY['rectus-abdominis'],
    ARRAY[],
    'beginner', 'strength'),

-- Cardio exercises
('running-001', 'Running', 'Cardio exercise',
    ARRAY['Start at comfortable pace', 'Maintain good posture', 'Land mid-foot', 'Swing arms naturally'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/running.gif',
    ARRAY['none'],
    ARRAY['cardio'],
    ARRAY['cardiovascular-system'],
    ARRAY['quadriceps', 'hamstrings', 'calves'],
    'beginner', 'cardio'),

('jump-rope-001', 'Jump Rope', 'High-intensity cardio',
    ARRAY['Hold rope handles', 'Swing rope over head', 'Jump as rope passes under feet', 'Stay on balls of feet'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/jump-rope.gif',
    ARRAY['jump-rope'],
    ARRAY['cardio', 'calves'],
    ARRAY['cardiovascular-system'],
    ARRAY['calves', 'shoulders'],
    'beginner', 'cardio'),

('burpee-001', 'Burpees', 'Full-body conditioning',
    ARRAY['Start standing', 'Drop to plank', 'Do push-up', 'Jump feet to hands', 'Jump up explosively'],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/burpee.gif',
    ARRAY['bodyweight'],
    ARRAY['full-body', 'cardio'],
    ARRAY['cardiovascular-system'],
    ARRAY['chest', 'legs', 'core'],
    'intermediate', 'cardio')

ON CONFLICT DO NOTHING;
