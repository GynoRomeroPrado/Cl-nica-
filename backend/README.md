# Health & Fitness Backend API

NestJS backend API for the Health & Fitness application.

## Features

- **Authentication**: JWT-based auth with Supabase
- **User Management**: Profile, settings, and stats
- **Workouts**: Track workouts, exercises, and sets
- **Medications**: Medication reminders and tracking
- **Health News**: Curated health articles from PubMed and NewsAPI
- **Gamification**: Achievements and leaderboards
- **Real-time**: WebSocket support for live features
- **Rate Limiting**: 100 requests per 15 minutes
- **Caching**: Redis for performance

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Redis (local or Upstash)

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update environment variables in `.env`

### Running the App

```bash
# Development
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000/api`

API documentation (Swagger): `http://localhost:3000/api/docs`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /signup` - Register new user
- `POST /signin` - Sign in with email/password
- `POST /signout` - Sign out user
- `POST /refresh` - Refresh access token
- `POST /reset-password` - Request password reset
- `POST /update-password` - Update password
- `GET /me` - Get current user

### Users (`/api/users`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /stats` - Get user statistics
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings

### Workouts (`/api/workouts`)

- `GET /` - Get user workouts
- `GET /:id` - Get workout by ID
- `POST /` - Create new workout
- `PUT /:id` - Update workout
- `DELETE /:id` - Delete workout

### Exercises (`/api/exercises`)

- `GET /` - Get exercises
- `GET /:id` - Get exercise by ID
- `GET /search` - Search exercises
- `GET /sync` - Sync from ExerciseDB

### Medications (`/api/medications`)

- `GET /` - Get user medications
- `GET /:id` - Get medication by ID
- `POST /` - Create medication
- `PUT /:id` - Update medication
- `DELETE /:id` - Delete medication
- `POST /:id/log` - Log medication intake

### Health News (`/api/health-news`)

- `GET /` - Get health articles
- `GET /pubmed` - Search PubMed
- `GET /news` - Get latest health news

### Gamification (`/api/gamification`)

- `GET /achievements` - Get achievements
- `GET /leaderboard` - Get leaderboard
- `GET /my-achievements` - Get user achievements

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Docker

```bash
# Build
docker build -t health-fitness-api .

# Run
docker run -p 3000:3000 health-fitness-api
```

## Architecture

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── workouts/     # Workout tracking
│   ├── exercises/    # Exercise library
│   ├── medications/  # Medication reminders
│   ├── health-news/  # Health articles
│   └── gamification/ # Achievements
├── common/           # Shared code
│   ├── guards/       # Auth guards
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── interceptors/ # Interceptors
│   └── pipes/        # Validation pipes
├── config/           # Configuration
└── main.ts           # Entry point
```

## Security

- JWT authentication
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS protection
- Input validation
- SQL injection prevention (Supabase RLS)

## License

MIT
