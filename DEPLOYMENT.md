# Deployment Guide

This guide covers deploying the Health & Fitness application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup)
3. [Backend Deployment (Railway)](#backend-deployment)
4. [ML Service Deployment](#ml-service-deployment)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Analytics](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [Supabase](https://supabase.com) - Database & Auth
- [Railway](https://railway.app) - Backend hosting
- [Upstash](https://upstash.com) - Redis cache (optional, can use Railway)
- [CloudFlare](https://cloudflare.com) - CDN & R2 storage
- [RapidAPI](https://rapidapi.com) - ExerciseDB API
- [NewsAPI](https://newsapi.org) - Health news
- App Store Connect (iOS deployment)
- Google Play Console (Android deployment)

### Development Tools

- Node.js 20+
- Flutter 3.19+
- Python 3.11+
- Docker (for local testing)
- Railway CLI
- Git

---

## Database Setup (Supabase)

### 1. Create Supabase Project

```bash
# Visit https://supabase.com
# Click "New Project"
# Choose region closest to your users
# Set strong database password
```

### 2. Run Database Schema

```bash
# Copy schema SQL
cat database/schema.sql

# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste schema.sql contents
# 3. Click "Run"
```

### 3. Seed Initial Data

```bash
# Run seed files
cat database/seeds/01_sample_exercises.sql

# Paste in SQL Editor and run
```

### 4. Configure Authentication

```bash
# In Supabase Dashboard > Authentication > Providers:
# 1. Enable Email provider
# 2. Enable Google OAuth (optional)
# 3. Enable Apple OAuth (optional)
# 4. Set Site URL to your domain
# 5. Add redirect URLs
```

### 5. Get API Keys

```bash
# In Supabase Dashboard > Settings > API:
# Copy these values:
# - Project URL
# - anon/public key
# - service_role key (keep secret!)
```

---

## Backend Deployment (Railway)

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Create New Project

```bash
cd backend
railway init
# Choose "Create a new project"
# Name: health-fitness-backend
```

### 4. Add Redis Service

```bash
railway add
# Select "Redis"
```

### 5. Set Environment Variables

```bash
# Add these variables in Railway Dashboard:

NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-strong-secret>
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
REDIS_URL=${{Redis.REDIS_URL}}
RAPIDAPI_KEY=<your-rapidapi-key>
NEWS_API_KEY=<your-newsapi-key>
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

### 6. Deploy

```bash
railway up
```

### 7. Get Deployment URL

```bash
railway open
# Copy the generated URL
# Or add custom domain in Railway Dashboard > Settings > Domains
```

---

## ML Service Deployment

### Option 1: Railway

```bash
cd ml-service
railway init
# Link to existing project or create new

# Add environment variables
railway variables set PYTHONUNBUFFERED=1

# Deploy
railway up
```

### Option 2: Docker on Cloud Run (GCP)

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/ml-service

# Deploy to Cloud Run
gcloud run deploy ml-service \
  --image gcr.io/YOUR_PROJECT/ml-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: AWS Lambda (Serverless)

Use [Mangum](https://mangum.io/) to wrap FastAPI for Lambda:

```python
# lambda_handler.py
from mangum import Mangum
from main import app

handler = Mangum(app)
```

---

## Mobile App Deployment

### Android (Google Play)

#### 1. Generate Keystore

```bash
keytool -genkey -v -keystore ~/health-fitness-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias health-fitness
```

#### 2. Configure Signing

Create `mobile/android/key.properties`:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=health-fitness
storeFile=/path/to/health-fitness-key.jks
```

Update `mobile/android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. Build Release APK/AAB

```bash
cd mobile

# Build App Bundle (recommended for Play Store)
flutter build appbundle --release

# Or build APK
flutter build apk --release --split-per-abi
```

#### 4. Upload to Play Console

```bash
# Visit https://play.google.com/console
# Create app > Upload AAB > Fill store listing
# Complete all required sections
# Submit for review
```

### iOS (App Store)

#### 1. Apple Developer Account

- Enroll in [Apple Developer Program](https://developer.apple.com) ($99/year)
- Create App ID in Certificates, Identifiers & Profiles
- Create Provisioning Profile

#### 2. Configure Xcode

```bash
cd mobile
open ios/Runner.xcworkspace

# In Xcode:
# 1. Select Runner > Signing & Capabilities
# 2. Select your Team
# 3. Choose automatic signing
# 4. Set Bundle Identifier
```

#### 3. Build Release IPA

```bash
flutter build ipa --release
```

#### 4. Upload to App Store Connect

```bash
# Option 1: Xcode
# Product > Archive > Distribute App

# Option 2: Transporter app
# Download Transporter from Mac App Store
# Drag .ipa file to upload
```

#### 5. Submit for Review

```bash
# Visit https://appstoreconnect.apple.com
# Fill App Information, Pricing, Screenshots
# Submit for Review
# Wait 1-3 days for approval
```

---

## Environment Configuration

### Backend .env (Production)

```env
NODE_ENV=production
PORT=3000
APP_URL=https://api.yourapp.com

ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com

JWT_SECRET=<generated-secret-256-bit>

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379

RAPIDAPI_KEY=xxxxx
NEWS_API_KEY=xxxxx
PUBMED_API_KEY=

ML_SERVICE_URL=https://ml-service.yourapp.com

RATE_LIMIT_TTL=900000
RATE_LIMIT_MAX=100

SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Flutter Environment Variables

Create `mobile/lib/core/config/env_config.dart`:

```dart
class EnvConfig {
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'production');

  static const String supabaseUrl = environment == 'production'
      ? 'https://xxxxx.supabase.co'
      : 'https://dev-xxxxx.supabase.co';

  static const String supabaseAnonKey = environment == 'production'
      ? 'production-key'
      : 'dev-key';

  static const String apiBaseUrl = environment == 'production'
      ? 'https://api.yourapp.com'
      : 'http://localhost:3000/api';
}
```

Build with environment:

```bash
flutter build apk --release --dart-define=ENV=production
```

---

## Monitoring & Analytics

### 1. Sentry (Error Tracking)

```bash
# Backend
npm install @sentry/node

# In main.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });

# Flutter
flutter pub add sentry_flutter

# In main.dart
await SentryFlutter.init(
  (options) => options.dsn = 'your-dsn',
  appRunner: () => runApp(MyApp()),
);
```

### 2. Mixpanel (Analytics)

```bash
# Flutter
flutter pub add mixpanel_flutter

# Track events
Mixpanel.getInstance().track('Workout Completed', properties: {
  'exercise_count': 5,
  'duration_minutes': 45,
});
```

### 3. Health Checks

```bash
# Backend health endpoint
GET /api/health

# Monitor these endpoints:
# - https://api.yourapp.com/api/health
# - https://ml-service.yourapp.com/health

# Use UptimeRobot or Pingdom for monitoring
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
railway logs

# Common issues:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Redis connection failed
```

### Database connection errors

```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check RLS policies are not blocking
# Temporarily disable RLS for debugging (DEV ONLY):
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
```

### Mobile build failures

```bash
# Flutter build errors
flutter clean
flutter pub get
flutter build apk --verbose

# Check Flutter version
flutter --version
flutter doctor -v
```

### API rate limiting issues

```bash
# Increase rate limits in backend
# throttler.module.ts
limit: 200  # from 100
```

---

## Scaling Strategy

### Phase 1: MVP (0-1K users)

- Railway Starter ($5/mo)
- Supabase Free tier
- Upstash Free tier
- **Cost**: ~$30/month

### Phase 2: Growth (1K-10K users)

- Railway Pro ($20/mo) or AWS EC2 t3.medium
- Supabase Pro ($25/mo)
- Upstash Standard ($10/mo)
- CloudFlare CDN
- **Cost**: ~$100-200/month

### Phase 3: Scale (10K-100K users)

- AWS/GCP with load balancing
- Supabase Team plan or self-hosted Postgres
- Redis cluster
- Multi-region deployment
- **Cost**: ~$500-2000/month

---

## Security Checklist

- [ ] All environment variables secured
- [ ] HTTPS enabled on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Secrets rotation plan in place
- [ ] Database backups enabled (Supabase auto-backups)
- [ ] Monitoring alerts set up
- [ ] Error tracking configured
- [ ] API keys never committed to Git

---

## Support

For deployment issues:

- **Documentation**: [docs.yourapp.com](https://docs.yourapp.com)
- **Email**: devops@healthapp.com
- **Discord**: [Join our server](https://discord.gg/yourapp)

---

**Last Updated**: January 2025
