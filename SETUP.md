# Pig Farm Management System - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Database Management](#database-management)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** v12 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### System Requirements
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Disk Space**: 500MB for installation + space for database
- **Network**: Internet access for npm packages

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/pig-farm-management.git
cd pig-farm-management
```

### Step 2: Setup PostgreSQL Database

#### On Windows:
```bash
# Start PostgreSQL service
# Open pgAdmin or use command line:
createdb pig_farm

# Create db user (optional but recommended)
psql -U postgres -c "CREATE USER pig_farm_user WITH PASSWORD 'your_secure_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pig_farm TO pig_farm_user;"
```

#### On macOS:
```bash
# Using Homebrew
brew services start postgresql

# Create database
createdb pig_farm

# Create user
createuser pig_farm_user -P  # Will prompt for password
psql pig_farm -c "GRANT ALL PRIVILEGES ON DATABASE pig_farm TO pig_farm_user;"
```

#### On Linux (Ubuntu/Debian):
```bash
sudo service postgresql start

sudo -u postgres createdb pig_farm
sudo -u postgres createuser pig_farm_user -P
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pig_farm TO pig_farm_user;"
```

### Step 3: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# Edit the following lines:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=pig_farm
# DB_USER=pig_farm_user
# DB_PASSWORD=your_secure_password
# JWT_SECRET=your_super_secret_jwt_key_here_change_this

nano .env  # or use your preferred editor

# Initialize database schema
npm run db:init

# Start development server
npm run dev
```

The backend will start on `http://localhost:5000`

**Test the backend:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Step 4: Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional, defaults work for development)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

The frontend will open in your browser at `http://localhost:3000`

### Step 5: Create Initial User

```bash
# Use the registration endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password",
    "fullName": "Administrator"
  }'

# Then login at http://localhost:3000/login
```

## Production Deployment

### Option 1: Deploy on Heroku

#### Prerequisites
- Heroku CLI installed ([Download](https://devcenter.heroku.com/articles/heroku-cli))
- Heroku account created

#### Steps

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create pig-farm-management

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_super_secret_key_change_this
heroku config:set NODE_ENV=production

# Deploy backend
cd backend
git push heroku main

# Check database is initialized
heroku run npm run db:init

# Deploy frontend to frontend hosting (see below)
```

### Option 2: Deploy on AWS

#### Backend (EC2 + RDS)
```bash
# Launch EC2 instance (Ubuntu 20.04)
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Clone repo
git clone https://github.com/YOUR_USERNAME/pig-farm-management.git
cd pig-farm-management/backend

# Install and setup
npm install
cp .env.example .env

# Edit .env with RDS endpoint
nano .env

# Initialize database
npm run db:init

# Start with PM2 (process manager)
npm install -g pm2
pm2 start src/server.js --name "pig-farm-api"
pm2 startup
pm2 save
```

#### Frontend (S3 + CloudFront)
```bash
cd frontend

# Build production version
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 3: Deploy with Docker

Create `Dockerfile` for backend:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: pig_farm
      POSTGRES_USER: pig_farm_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: pig_farm
      DB_USER: pig_farm_user
      DB_PASSWORD: secure_password
      JWT_SECRET: your_secret_key
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Deploy with Docker:
```bash
docker-compose up -d
```

### Option 4: Deploy on DigitalOcean

```bash
# Create Droplet (Ubuntu 20.04)
# SSH into droplet
ssh root@your_droplet_ip

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Clone and setup (same as AWS)
git clone https://github.com/YOUR_USERNAME/pig-farm-management.git
# ... follow backend setup steps
```

## Database Management

### Backup Database

```bash
# Backup to file
pg_dump -U pig_farm_user pig_farm > pig_farm_backup.sql

# Restore from backup
psql -U pig_farm_user pig_farm < pig_farm_backup.sql
```

### Reset Database

```bash
# Drop and recreate (careful!)
dropdb pig_farm
createdb pig_farm

# Re-initialize schema
cd backend
npm run db:init
```

### Monitor Database

```bash
# Connect to database
psql -U pig_farm_user pig_farm

# Useful commands:
# \dt              - list all tables
# \d pigs          - describe table structure
# SELECT * FROM pigs; - query data
# \q              - quit
```

## Environment Variables Reference

Create `.env` in backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pig_farm
DB_USER=pig_farm_user
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRY=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Verify PostgreSQL is running
sudo service postgresql status

# Check connection string
psql -U pig_farm_user -h localhost pig_farm

# Verify credentials in .env file
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Issue: "npm packages missing"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

### Issue: "Database initialization fails"

**Solution:**
```bash
# Check PostgreSQL is running
sudo service postgresql start

# Verify database exists
psql -l

# Try manual connection
psql -U pig_farm_user -h localhost -d pig_farm

# Check .env credentials
cat backend/.env
```

### Issue: "Frontend cannot reach backend API"

**Solution:**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS_ORIGIN in .env matches frontend URL
# Default: http://localhost:3000

# Check browser console for CORS errors
# Try clearing browser cache
```

### Issue: "npm start on frontend hangs"

**Solution:**
```bash
# Kill any existing processes
pkill -f "react-scripts"

# Clear React cache
rm -rf frontend/node_modules/.cache

# Try again
cd frontend && npm start
```

## Performance Tuning

### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM pigs WHERE status = 'active';

-- Rebuild indexes
REINDEX TABLE pigs;
```

### Increase Connection Pool
In `backend/src/database/config.js`:
```javascript
const pool = new Pool({
  max: 20,  // increase from default
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Enable Compression
In `backend/src/server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

## Monitoring

### Check Backend Logs
```bash
# Real-time logs
pm2 logs pig-farm-api

# Or with Docker
docker logs -f pig-farm-management_backend_1
```

### Monitor Database Usage
```bash
# Connect to database
psql -U pig_farm_user pig_farm

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Recommendations

1. **Change Default Credentials**
   - Update JWT_SECRET in .env
   - Update database password
   - Update admin user credentials

2. **Use HTTPS**
   - Install SSL certificate
   - Redirect HTTP to HTTPS
   - Set secure cookies

3. **Database Security**
   - Regular backups
   - Use strong passwords
   - Limit database access

4. **API Security**
   - Implement rate limiting
   - Add request validation
   - Monitor for suspicious activity

5. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

## Next Steps

1. **Create initial users** via API or admin panel
2. **Add pig data** to test the system
3. **Setup automated backups** for database
4. **Configure monitoring** and alerts
5. **Train users** on system functionality

## Support

For issues or questions, refer to:
- [GitHub Issues](https://github.com/YOUR_USERNAME/pig-farm-management/issues)
- [Project Documentation](./README.md)
- [API Documentation](#api-documentation)

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-best-practices/)
