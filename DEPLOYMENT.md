# Deployment Guide - Clinical Management System

Complete guide for deploying the multi-tenant clinical management system to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Dashboard Deployment](#dashboard-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)

---

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v9 or higher
- **Supabase Account**: For PostgreSQL database
- **Docker** (optional): For containerized deployment
- **Domain**: For production deployment
- **SSL Certificate**: For HTTPS (recommended: Let's Encrypt)

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning (~2 minutes)
4. Note your project URL and anon key

### 2. Run Database Migrations

Execute the SQL schema:

```bash
# Connect to Supabase SQL Editor
# Copy and paste the contents of database/schema_clinical.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### 3. Verify Tables

Ensure all tables are created:
- `clinics`
- `users`
- `staff_profiles`
- `patient_profiles`
- `appointments`
- `medical_records`
- `prescriptions`
- `lab_orders`
- `invoices`
- `telemedicine_sessions`
- `audit_logs`
- And more (23+ tables total)

### 4. Enable Row Level Security (RLS)

RLS policies are included in the schema. Verify they're enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Backend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Configure Project**:
   ```bash
   cd backend
   vercel init
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_KEY
   vercel env add JWT_SECRET
   vercel env add PRESCRIPTION_SIGNATURE_SECRET
   vercel env add VIDEO_SECRET
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Select backend directory

2. **Environment Variables**:
   Add all variables from `.env.example`

3. **Deploy**:
   - Auto-deploys on git push

### Option 3: Render

1. **Create Web Service**:
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect repository

2. **Configure**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Root Directory**: `backend`

3. **Environment Variables**:
   Add all required variables

### Option 4: DigitalOcean App Platform

1. **Create App**:
   - New App → GitHub
   - Select repository

2. **Configure**:
   - **Type**: Node.js
   - **Build**: `npm run build`
   - **Run**: `npm run start:prod`

3. **Add Environment Variables**

---

## Dashboard Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Deploy to Vercel**:
   ```bash
   cd dashboard-admin
   vercel --prod
   ```

2. **Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```

   Set to your backend URL (e.g., `https://api.clinical.com`)

3. **Custom Domain** (optional):
   - Add domain in Vercel dashboard
   - Update DNS records

### Option 2: Netlify

1. **Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

2. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend URL

### Option 3: Static Export + CDN

```bash
# Add to next.config.js
output: 'export'

# Build
npm run build

# Deploy /out directory to any CDN
# (AWS S3, Cloudflare Pages, etc.)
```

---

## Docker Deployment

### Quick Start

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Configuration

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build images**:
   ```bash
   docker-compose build
   ```

3. **Run in production**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Docker Swarm (Multi-Node)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml clinical

# Scale services
docker service scale clinical_backend=3
docker service scale clinical_dashboard=2
```

### Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests.

---

## Environment Variables

### Backend (.env)

```env
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
JWT_SECRET=your-256-bit-secret
PRESCRIPTION_SIGNATURE_SECRET=your-hmac-secret
VIDEO_SECRET=your-video-secret

# Optional
PORT=3000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@clinic.com
SMTP_PASS=app-password
```

### Dashboard (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourclinic.com
```

---

## Post-Deployment

### 1. Create First Admin User

```sql
-- In Supabase SQL Editor
INSERT INTO users (email, full_name, role, password_hash)
VALUES ('admin@clinic.com', 'Admin User', 'admin', 'hashed-password');

-- Create clinic
INSERT INTO clinics (name, email, phone, address)
VALUES ('Main Clinic', 'contact@clinic.com', '+1234567890', '123 Main St');

-- Link admin to clinic
UPDATE users SET clinic_id = (SELECT clinic_id FROM clinics LIMIT 1)
WHERE email = 'admin@clinic.com';
```

### 2. Verify Endpoints

```bash
# Health check
curl https://api.yourclinic.com/health

# Test authentication
curl -X POST https://api.yourclinic.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"password"}'
```

### 3. SSL/HTTPS Setup

For production, always use HTTPS:

- **Vercel/Netlify**: Automatic SSL
- **Custom server**: Use Let's Encrypt

```bash
# Certbot (Let's Encrypt)
sudo certbot --nginx -d api.yourclinic.com
```

### 4. Configure CORS

In backend, update allowed origins:

```typescript
// main.ts
app.enableCors({
  origin: ['https://dashboard.yourclinic.com'],
  credentials: true,
});
```

---

## Monitoring

### Health Checks

Add to backend:

```typescript
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
}
```

### Logging

Use production logging service:

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **DataDog**: Full observability

```typescript
// Install Sentry
npm install @sentry/node

// Initialize
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Metrics

Track important metrics:

- **API Response Times**
- **Database Query Performance**
- **Error Rates**
- **User Sessions**
- **PHI Access Logs**

### Uptime Monitoring

Use services like:

- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**

Configure monitoring for:
- `https://api.yourclinic.com/health`
- `https://dashboard.yourclinic.com`

---

## Backup Strategy

### Database Backups

Supabase provides automatic backups. For additional safety:

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://clinical-backups/
```

### File Backups

If storing files locally, backup upload directories:

```bash
# Backup uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz /path/to/uploads

# Upload to cloud storage
```

---

## Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Audit logging working
- [ ] JWT secrets rotated
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] DDoS protection enabled
- [ ] Regular security audits scheduled

---

## Scaling

### Horizontal Scaling

```bash
# Docker Swarm
docker service scale clinical_backend=5

# Kubernetes
kubectl scale deployment backend --replicas=5
```

### Database Scaling

Supabase scales automatically. For high load:

- Enable read replicas
- Use connection pooling
- Implement caching (Redis)

### CDN for Static Assets

Use CloudFlare, AWS CloudFront, or similar for:

- Dashboard static files
- Medical images
- Documents

---

## Troubleshooting

### Backend won't start

1. Check environment variables
2. Verify database connection
3. Check logs: `docker logs clinical-backend`

### Database connection issues

1. Verify SUPABASE_URL and SUPABASE_KEY
2. Check Supabase project status
3. Verify network/firewall rules

### CORS errors

Update backend CORS configuration:

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});
```

---

## Support

For deployment assistance:

- **Documentation**: Check README files
- **Issues**: GitHub Issues
- **Email**: support@clinical.com

---

## License

Proprietary - Multi-Tenant Clinical Management System

**Last Updated**: 2025-01-17
