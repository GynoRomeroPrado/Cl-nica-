# 🏋️ Health & Fitness App - MVP

Comprehensive health and fitness mobile application combining workout tracking, medication reminders, health news, and gamification.

## 🎯 Features (MVP - Phase 1)

### Core Modules
- **💪 Workout Tracking**: 1,000+ exercises with GIFs/videos, set/rep/weight logging, workout history
- **💊 Medication Reminders**: Smart alarm system, calendar view, drug interaction checker, refill reminders
- **📰 Health News**: Curated content from PubMed and NewsAPI with credibility scoring
- **🎮 Gamification**: Daily quotes, achievements, streaks, leaderboards
- **🔐 Authentication**: Email/password + OAuth (Google/Apple)
- **🤖 Machine Learning**: Personalized workout recommendations, injury prediction (ACWR)

## 🛠️ Tech Stack

### Mobile
- **Framework**: Flutter 3.19+
- **State Management**: Riverpod 2.4+
- **Local Database**: Hive/Isar (offline-first)
- **Notifications**: Flutter Local Notifications + Android Alarm Manager

### Backend
- **API**: Node.js 20+ with NestJS 10+
- **Real-time**: Socket.IO
- **Database**: PostgreSQL 16+ (Supabase)
- **Cache**: Upstash Redis (serverless)
- **ML Service**: Python 3.11+ with FastAPI

### Infrastructure
- **Hosting**: Railway ($5/mo) + Supabase ($25/mo)
- **CDN**: CloudFlare (free tier) with R2 storage
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors) + Mixpanel (analytics)

## 📁 Project Structure

```
Cl-nica-/
├── mobile/                 # Flutter mobile app
│   ├── lib/
│   │   ├── features/      # Feature modules
│   │   │   ├── auth/
│   │   │   ├── workouts/
│   │   │   ├── medications/
│   │   │   ├── health_news/
│   │   │   └── gamification/
│   │   ├── core/          # Core utilities
│   │   ├── models/        # Data models
│   │   └── main.dart
│   └── pubspec.yaml
│
├── backend/               # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── workouts/
│   │   │   ├── medications/
│   │   │   └── health-news/
│   │   └── main.ts
│   └── package.json
│
├── ml-service/            # Python ML microservice
│   ├── models/
│   ├── api/
│   └── requirements.txt
│
├── database/              # Database schemas
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
│
└── docs/                  # Documentation
    ├── API.md
    ├── PRIVACY_POLICY.md
    └── TERMS_OF_SERVICE.md
```

## 🚀 Quick Start

### Prerequisites
- Flutter 3.19+
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+ (or Supabase account)
- Redis (or Upstash account)

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd Cl-nica-
```

2. **Setup Database**
```bash
# Run schema in Supabase or local PostgreSQL
psql -U postgres -f database/schema.sql
```

3. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run start:dev
```

4. **Setup ML Service**
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

5. **Setup Mobile App**
```bash
cd mobile
flutter pub get
flutter run
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/healthapp
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
RAPIDAPI_KEY=xxx
NEWSAPI_KEY=xxx
PUBMED_API_KEY=xxx
JWT_SECRET=xxx
```

**Mobile (lib/core/config.dart)**
```dart
const String SUPABASE_URL = 'https://xxx.supabase.co';
const String SUPABASE_ANON_KEY = 'xxx';
const String API_BASE_URL = 'https://api.yourapp.com';
```

## 📊 Database Schema

The complete database schema includes:
- Users & Authentication
- Exercises & Workouts
- Medications & Schedules
- Health Articles
- Gamification (achievements, leaderboards)
- Social Features (friends, comments)

See [database/schema.sql](database/schema.sql) for full schema.

## 🔐 Security & Compliance

- **Encryption**: AES-256-GCM for sensitive data
- **GDPR Compliant**: Data export, right to deletion
- **HIPAA Considerations**: No PHI storage without BAA
- **Row Level Security**: Enabled on Supabase
- **Rate Limiting**: 100 req/15min per user

## 📈 Roadmap

### Phase 1: MVP (Months 1-3) ✅ Current
- Basic workout tracking
- Medication reminders
- Exercise library
- Authentication
- Simple gamification

### Phase 2: Growth (Months 4-6)
- Pose detection (MediaPipe)
- ML recommendations
- Social features
- Premium subscription

### Phase 3: Scale (Months 7-12)
- AR workout guidance
- Wearable integrations
- Nutrition tracking
- Live classes

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Mobile tests
cd mobile
flutter test
flutter test integration_test/
```

## 📦 Deployment

### Backend (Railway)
```bash
railway init
railway up
```

### Mobile
```bash
# Android
flutter build apk --release

# iOS
flutter build ipa --release
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

- Email: support@healthapp.com
- Privacy: privacy@healthapp.com
- DPO: dpo@healthapp.com

## 🙏 Acknowledgments

- [ExerciseDB](https://github.com/yuhonas/free-exercise-db) - Exercise database
- [PubMed](https://pubmed.ncbi.nlm.nih.gov/) - Medical research
- [NewsAPI](https://newsapi.org/) - Health news
- [ZenQuotes](https://zenquotes.io/) - Motivational quotes

---

**Market Size**: $16.6B (2024) → $88B (2032) | CAGR 15.4%

**Target Users**: Fitness enthusiasts, chronic disease patients, adults 25-55 years
