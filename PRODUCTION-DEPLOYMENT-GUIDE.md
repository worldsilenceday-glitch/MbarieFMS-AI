# Mbarie FMS AI - Production Deployment Guide

## Overview

This guide provides complete instructions for deploying the Mbarie FMS AI system to production using Docker Compose.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- Production environment variables configured
- Domain names configured (if using custom domains)

## Quick Start

### 1. Prepare Production Environment

```bash
# Copy development .env to production
cp .env .env.prod

# Edit production environment variables
nano .env.prod
```

**Required Production Environment Variables (.env.prod):**
```env
# Core
NODE_ENV=production
PORT=5000

# Database
DB_PASSWORD=your_secure_production_password

# Authentication
JWT_SECRET=your_secure_jwt_secret

# AI
OPENAI_API_KEY=your_openai_api_key

# Email / SMTP
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email_user
SMTP_PASS=your_email_password
SMTP_FROM="Mbarie FMS AI" <your_email_user>

# URLs (update with your actual domains)
CLIENT_URL=https://your-frontend-domain.com
SERVER_URL=https://your-backend-domain.com
```

### 2. Deploy with Docker Compose

```bash
# Deploy the entire stack
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps
```

### 3. Run Database Migrations

```bash
# Execute Prisma migrations
docker exec mbarie-fms-ai-server npx prisma migrate deploy

# Seed initial data
docker exec mbarie-fms-ai-server npx prisma db seed
```

## Architecture

The production stack includes:

- **PostgreSQL**: Database (port 5432)
- **Server**: Backend API (port 5000)
- **Client**: Frontend with Nginx (port 80)
- **Backup**: Database backup service

## Service Details

### PostgreSQL Database
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Database**: `fms_ai`
- **User**: `postgres`
- **Password**: From `DB_PASSWORD` environment variable
- **Volume**: Persistent data storage
- **Health Check**: Automatic PostgreSQL readiness checks

### Backend Server
- **Port**: 5000
- **Environment**: All production variables from `.env.prod`
- **Health Check**: API health endpoint
- **Dependencies**: Waits for PostgreSQL to be healthy
- **Volumes**: Uploads and logs directories

### Frontend Client
- **Port**: 80
- **Server**: Nginx with optimized configuration
- **Features**: 
  - Gzip compression
  - Security headers
  - Static asset caching
  - API proxy to backend
  - Client-side routing support

### Backup Service
- **Purpose**: Database backup management
- **Manual Backup**: `docker exec mbarie-fms-ai-backup /scripts/backup.sh`
- **Location**: `./backups/` directory

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Server**: HTTP health endpoint `/api/health`
- **Client**: HTTP health endpoint `/health`

## Monitoring

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.prod.yml logs server

# Follow logs
docker compose -f docker-compose.prod.yml logs -f
```

### Service Status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml top
```

## Maintenance

### Database Backups
```bash
# Manual backup
docker exec mbarie-fms-ai-backup /scripts/backup.sh

# List backups
ls -la backups/
```

### Updates and Restarts
```bash
# Update and restart
docker compose -f docker-compose.prod.yml up --build -d

# Restart specific service
docker compose -f docker-compose.prod.yml restart server

# Scale services (if needed)
docker compose -f docker-compose.prod.yml up --scale server=2 -d
```

### Cleanup
```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: data loss)
docker compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check PostgreSQL logs: `docker logs mbarie-fms-ai-postgres`
   - Verify DATABASE_URL in environment variables

2. **Server Not Starting**
   - Check server logs: `docker logs mbarie-fms-ai-server`
   - Verify all required environment variables are set

3. **Client Not Loading**
   - Check client logs: `docker logs mbarie-fms-ai-client`
   - Verify API_URL configuration

4. **Health Check Failures**
   - Check service dependencies
   - Verify network connectivity between containers

### Debug Commands

```bash
# Shell access to containers
docker exec -it mbarie-fms-ai-server sh
docker exec -it mbarie-fms-ai-postgres psql -U postgres -d fms_ai

# Network inspection
docker network ls
docker network inspect mbarie-fms-ai-network

# Resource usage
docker stats
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.prod` to version control
2. **Database Passwords**: Use strong, unique passwords
3. **JWT Secrets**: Use cryptographically secure random strings
4. **Port Exposure**: Consider using reverse proxy for additional security
5. **Volume Security**: Ensure proper file permissions on mounted volumes

## Scaling

For higher traffic loads:

```bash
# Scale backend services
docker compose -f docker-compose.prod.yml up --scale server=3 -d

# Add load balancer (external)
# Consider using Traefik or Nginx as reverse proxy
```

## Backup and Recovery

### Automated Backups (Optional)
Add cron job for regular backups:
```bash
# Add to crontab (crontab -e)
0 2 * * * docker exec mbarie-fms-ai-backup /scripts/backup.sh
```

### Database Recovery
```bash
# Restore from backup
docker exec -i mbarie-fms-ai-postgres pg_restore -U postgres -d fms_ai < backups/backup_file.dump
```

## Performance Optimization

1. **Database**: Consider adding indexes for frequently queried fields
2. **Caching**: Implement Redis for session and data caching
3. **CDN**: Use CDN for static assets in production
4. **Monitoring**: Add application performance monitoring (APM)

## Support

For deployment issues:
1. Check service logs
2. Verify environment variables
3. Ensure Docker resources are adequate
4. Check network connectivity between services

## Next Steps

After successful deployment:
1. Configure SSL certificates (if using custom domains)
2. Set up monitoring and alerting
3. Implement log aggregation
4. Configure automated backups
5. Set up CI/CD pipeline for updates
