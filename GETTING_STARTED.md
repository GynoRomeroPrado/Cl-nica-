# Getting Started with Health & Fitness App

Congratulations! Your Health & Fitness MVP project is fully set up. This guide will help you get up and running.

## What's Been Created

### ✅ Complete Project Structure

```
Cl-nica-/
├── mobile/              # Flutter app (iOS/Android)
├── backend/             # NestJS API server
├── ml-service/          # Python ML microservice
├── database/            # SQL schemas and seeds
├── docs/                # Legal documents
├── .github/workflows/   # CI/CD pipelines
└── docker-compose.yml   # Local development setup
```

### ✅ Features Implemented

**MVP Phase 1 (Core Foundation):**
- ✅ User authentication (Supabase Auth)
- ✅ Database schema (20+ tables, RLS, triggers)
- ✅ Backend API structure (NestJS modules)
- ✅ Mobile app foundation (Flutter + Riverpod)
- ✅ Notification system (medication reminders)
- ✅ Workout tracking models
- ✅ CI/CD pipelines (GitHub Actions)
- ✅ Privacy Policy & Terms of Service
- ✅ Deployment configuration

**Pending Implementation:**
- ⏳ Exercise library sync (ExerciseDB API integration)
- ⏳ Gamification features (achievements, streaks, leaderboards)
- ⏳ Daily motivational quotes (ZenQuotes API)
- ⏳ Health news feed (PubMed + NewsAPI)
- ⏳ Drug interaction checker

---

## Quick Start (5 Steps)

### Step 1: Set Up Supabase (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name: `health-fitness-app`
   - Select region closest to your users
   - Set a strong database password
   - Wait ~2 minutes for provisioning

2. **Run Database Schema**
   ```bash
   # Copy the schema
   cat database/schema.sql

   # In Supabase Dashboard:
   # SQL Editor > New Query > Paste schema > Run
   ```

3. **Seed Sample Data**
   ```bash
   # Copy seed data
   cat database/seeds/01_sample_exercises.sql

   # Paste in SQL Editor > Run
   ```

4. **Get API Credentials**
   - Go to Settings > API
   - Copy these values:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon/public key**: `eyJhbG...`
     - **service_role key**: `eyJhbG...` (keep secret!)

5. **Enable Authentication Providers**
   - Go to Authentication > Providers
   - Enable Email
   - (Optional) Configure Google OAuth
   - (Optional) Configure Apple OAuth

### Step 2: Set Up Backend (10 minutes)

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env

   # Edit .env with your credentials:
   nano .env
   ```

   Update these values:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=generate-a-random-256-bit-secret
   ```

3. **Get API Keys**
   - **RapidAPI (ExerciseDB)**: [rapidapi.com/justin-WFnsXH_t6/api/exercisedb](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
   - **NewsAPI**: [newsapi.org](https://newsapi.org) (free tier: 100 req/day)
   - Add keys to `.env`

4. **Start Development Server**
   ```bash
   npm run start:dev
   ```

   Backend should be running at: http://localhost:3000

   API Docs: http://localhost:3000/api/docs

### Step 3: Set Up ML Service (5 minutes)

1. **Install Python Dependencies**
   ```bash
   cd ml-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start ML Service**
   ```bash
   uvicorn main:app --reload
   ```

   ML API running at: http://localhost:8000

   Docs: http://localhost:8000/docs

### Step 4: Set Up Mobile App (10 minutes)

1. **Install Flutter Dependencies**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Configure Supabase Credentials**

   Edit `mobile/lib/core/config/app_config.dart`:
   ```dart
   static const String supabaseUrl = 'https://xxxxx.supabase.co';
   static const String supabaseAnonKey = 'your-anon-key';
   ```

3. **Run App**
   ```bash
   # iOS Simulator
   flutter run -d iPhone

   # Android Emulator
   flutter run -d emulator-5554

   # Physical device
   flutter devices
   flutter run -d <device-id>
   ```

4. **Hot Reload**
   - Press `r` to hot reload
   - Press `R` to hot restart
   - Press `q` to quit

### Step 5: Verify Everything Works

1. **Test Backend API**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

2. **Test ML Service**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy"}
   ```

3. **Test Mobile App**
   - Open app on simulator/device
   - Should see splash screen with logo
   - App initializes Supabase connection

---

## Development Workflow

### Running All Services Together

**Option 1: Docker Compose (Recommended)**
```bash
# From project root
docker-compose up

# Backend: http://localhost:3000
# ML Service: http://localhost:8000
# Redis: localhost:6379
```

**Option 2: Manual (Multiple Terminals)**
```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - ML Service
cd ml-service && uvicorn main:app --reload

# Terminal 3 - Mobile
cd mobile && flutter run
```

### Making Changes

**Backend Changes:**
- Edit files in `backend/src/`
- NestJS watches for changes and auto-reloads
- Check logs for any errors

**Mobile Changes:**
- Edit files in `mobile/lib/`
- Press `r` in terminal for hot reload
- Press `R` for full restart

**Database Changes:**
- Create new migration in `database/migrations/`
- Run in Supabase SQL Editor
- Update schema.sql

---

## Next Implementation Steps

### 1. Complete Exercise Library Integration (2-3 hours)

**Files to create:**
- `backend/src/modules/exercises/exercises.service.ts`
- `backend/src/modules/exercises/exercises.controller.ts`
- `mobile/lib/features/workouts/providers/exercise_provider.dart`
- `mobile/lib/features/workouts/screens/exercise_library_screen.dart`

**Tasks:**
- Sync exercises from ExerciseDB API
- Cache in local database
- Implement search/filter by body part, equipment
- Display exercises with GIFs in Flutter

### 2. Implement Gamification (3-4 hours)

**Files to create:**
- `backend/src/modules/gamification/gamification.service.ts`
- `backend/src/modules/gamification/gamification.controller.ts`
- `mobile/lib/features/gamification/screens/achievements_screen.dart`
- `mobile/lib/features/gamification/widgets/achievement_card.dart`

**Tasks:**
- Achievement unlock logic
- Streak calculation
- Leaderboard queries
- Push notifications for achievements
- Animated achievement unlocks in Flutter

### 3. Add Daily Quotes (1-2 hours)

**Files to create:**
- `backend/src/modules/quotes/quotes.service.ts`
- `mobile/lib/features/home/widgets/daily_quote_card.dart`

**Tasks:**
- Fetch from ZenQuotes API
- Cache for 24 hours
- Display on home screen
- Share quote feature

### 4. Build Medication UI (4-5 hours)

**Files to create:**
- `mobile/lib/features/medications/screens/medications_list_screen.dart`
- `mobile/lib/features/medications/screens/add_medication_screen.dart`
- `mobile/lib/features/medications/screens/calendar_screen.dart`
- `mobile/lib/features/medications/providers/medication_provider.dart`

**Tasks:**
- Add/edit medication form
- Schedule configuration
- Calendar view with adherence tracking
- Notification integration
- Drug interaction warnings

### 5. Complete Workout Tracking UI (5-6 hours)

**Files to create:**
- `mobile/lib/features/workouts/screens/workout_session_screen.dart`
- `mobile/lib/features/workouts/screens/workout_history_screen.dart`
- `mobile/lib/features/workouts/widgets/exercise_selector.dart`
- `mobile/lib/features/workouts/widgets/set_tracker.dart`

**Tasks:**
- Live workout session
- Rest timer
- Set/rep input
- Progress charts
- Workout templates

---

## Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Mobile Tests
```bash
cd mobile

# Unit tests
flutter test

# Integration tests
flutter test integration_test/

# Widget tests
flutter test test/widgets/
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables secured (no hardcoded secrets)
- [ ] Database schema deployed to Supabase
- [ ] Backend deployed to Railway
- [ ] ML service deployed
- [ ] Mobile app built and tested
- [ ] Privacy Policy & ToS integrated in app
- [ ] App Store/Play Store listings created
- [ ] Monitoring set up (Sentry)
- [ ] Analytics configured (Mixpanel)
- [ ] Backups enabled

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## Common Issues & Solutions

### Backend won't connect to Supabase
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verify in .env file
cat backend/.env

# Test connection
curl https://xxxxx.supabase.co/rest/v1/
```

### Flutter build errors
```bash
# Clean build
flutter clean
flutter pub get

# Clear cache
flutter pub cache repair

# Check Flutter version
flutter --version
flutter doctor -v
```

### Port already in use
```bash
# Find process using port
lsof -i :3000  # Backend
lsof -i :8000  # ML service

# Kill process
kill -9 <PID>
```

### Redis connection errors
```bash
# Start local Redis
docker run -d -p 6379:6379 redis:7-alpine

# Or use Upstash (cloud Redis)
# Add REDIS_URL to .env
```

---

## Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com)
- [Flutter Docs](https://docs.flutter.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Riverpod Docs](https://riverpod.dev)

### APIs
- [ExerciseDB API](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [NewsAPI](https://newsapi.org/docs)
- [ZenQuotes](https://zenquotes.io)

### Community
- [Flutter Discord](https://discord.gg/flutter)
- [NestJS Discord](https://discord.gg/nestjs)
- [Supabase Discord](https://discord.supabase.com)

---

## Support

Having issues? Need help?

1. **Check Documentation**: Start with [README.md](README.md)
2. **Review Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Database Help**: [database/README.md](database/README.md)

---

## What's Next?

**Week 1-2:**
- ✅ Complete exercise library sync
- ✅ Build workout tracking UI
- ✅ Implement medication reminders

**Week 3-4:**
- ✅ Add gamification features
- ✅ Integrate health news feed
- ✅ Polish UI/UX

**Week 5-6:**
- ✅ Beta testing with 50-100 users
- ✅ Fix bugs and iterate
- ✅ Prepare for App Store submission

**Week 7-8:**
- ✅ Submit to App Store & Play Store
- ✅ Launch marketing campaign
- ✅ Monitor analytics and user feedback

---

**Ready to build the future of health and fitness? Let's go! 💪🏃‍♂️**

For questions or feedback, reach out to: support@healthapp.com

---

_Last Updated: January 2025_
