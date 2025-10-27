# Mbarie FMS AI - Production Deployment Checklist

## 🚀 Quick Deployment Checklist

### ✅ Pre-Deployment Preparation
- [ ] **Environment Setup**
  - [ ] Docker Engine 20.10+ and Docker Compose 2.0+ installed
  - [ ] Production environment variables configured in `.env.prod`
  - [ ] Domain names configured (if using custom domains)
  - [ ] SSL certificates ready (if using HTTPS)

- [ ] **Security Review**
  - [ ] No development credentials in production environment
  - [ ] Strong database password set (`DB_PASSWORD`)
  - [ ] Secure JWT secret configured (`JWT_SECRET`)
  - [ ] API keys for external services (OpenAI, SMTP) validated

### 🛠️ Deployment Execution
- [ ] **Docker Stack Deployment**
  ```bash
  docker compose -f docker-compose.prod.yml up --build -d
  ```

- [ ] **Database Setup**
  ```bash
  docker exec mbarie-fms-ai-server npx prisma migrate deploy
  docker exec mbarie-fms-ai-server npx prisma db seed
  ```

### ✅ Health & Verification
- [ ] **Service Health Checks**
  - [ ] PostgreSQL: `docker logs mbarie-fms-ai-postgres` (no errors)
  - [ ] Backend: `curl http://localhost:5000/api/health` (returns "OK")
  - [ ] Frontend: `curl http://localhost/health` (returns "OK")

- [ ] **Automated Deployment Verification**
  ```bash
  # Option 1: Verification only (recommended for manual deployment)
  node verifyDeployment.js
  
  # Option 2: Comprehensive verification + automatic Netlify deployment
  node deployAndVerify.js
  
  # With custom URLs
  VITE_SERVER_URL=https://your-backend.com VITE_CLIENT_URL=https://your-frontend.com node verifyDeployment.js
  VITE_SERVER_URL=https://your-backend.com VITE_CLIENT_URL=https://your-frontend.com node deployAndVerify.js
  ```

- [ ] **Frontend Route & API Verification Checklist**
  | Step | Action                           | Expected Result                          |
  | ---- | -------------------------------- | ---------------------------------------- |
  | 1    | Open DevTools → Console          | No JS errors                             |
  | 2    | Open DevTools → Network          | All API calls return 200                 |
  | 3    | Test `/` route (home/first page) | Home page content loads                  |
  | 4    | Test `/dashboard`                | Dashboard page loads                     |
  | 5    | Test `/activity`                 | Activity page loads                      |
  | 6    | Test `/ai-insights`              | AI Insights Dashboard loads              |
  | 7    | Test `/chat-agent`               | Chat Agent interface loads               |
  | 8    | Check local storage/session      | Data for offline mode exists if required |
  | 9    | Clear cache and reload           | Pages still load (service worker test)   |

- [ ] **Service Worker Verification**
  - [ ] Open browser DevTools → Application → Service Workers
  - [ ] Check that `service-worker.js` is active and serving pages
  - [ ] Go offline and test navigation between routes
  - [ ] All pages should still load if offline mode is properly configured

- [ ] **Application Verification**
  - [ ] Frontend loads at production URL
  - [ ] Backend API responds to requests
  - [ ] AI services function (test chat/insights)
  - [ ] Email notifications work (test approval workflow)
  - [ ] File uploads persist correctly
  - [ ] User authentication works

### 📊 Post-Deployment Monitoring
- [ ] **Initial Monitoring**
  - [ ] Check all service logs for errors
  - [ ] Verify resource usage (CPU, memory, disk)
  - [ ] Confirm database connections are stable
  - [ ] Test all major application workflows

- [ ] **Performance Validation**
  - [ ] Frontend loads within acceptable time (<3s)
  - [ ] API responses are timely (<1s for simple requests)
  - [ ] File uploads/downloads work correctly
  - [ ] AI processing completes successfully

## 🔧 Emergency Rollback Plan
- [ ] **Quick Rollback Procedure**
  ```bash
  # Stop current deployment
  docker compose -f docker-compose.prod.yml down
  
  # Restore from backup if needed
  docker exec -i mbarie-fms-ai-postgres pg_restore -U postgres -d fms_ai < backups/latest_backup.dump
  ```

## 📋 Critical Environment Variables Checklist
- [ ] `NODE_ENV=production`
- [ ] `DB_PASSWORD` (strong, unique)
- [ ] `JWT_SECRET` (secure random string)
- [ ] `OPENAI_API_KEY` (valid API key)
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (email service)
- [ ] `CLIENT_URL` and `SERVER_URL` (production domains)

## 🚨 Common Issues & Quick Fixes

### Database Issues
- **Problem**: Database connection failures
- **Fix**: Check `DATABASE_URL` and PostgreSQL logs

### Service Startup Failures
- **Problem**: Backend won't start
- **Fix**: Verify all environment variables are set

### Frontend Issues
- **Problem**: Frontend not loading
- **Fix**: Check Nginx configuration and API_URL

### AI Service Issues
- **Problem**: AI features not working
- **Fix**: Validate OpenAI API key and quota

## 📞 Emergency Contacts
- **Primary Ops**: [Team Lead Name]
- **Backup Ops**: [Secondary Contact]
- **Database Admin**: [DBA Contact]
- **Infrastructure**: [Infrastructure Team]

## 🔄 Maintenance Schedule
- [ ] **Daily**: Check service logs and health endpoints
- [ ] **Weekly**: Database backup verification
- [ ] **Monthly**: Security updates and dependency reviews
- [ ] **Quarterly**: Performance review and optimization

---

## 📝 Deployment Sign-off

**Deployment Completed By**: ____________________

**Date/Time**: ____________________

**Health Check Results**: 
- [ ] All services running
- [ ] All health endpoints responding
- [ ] Core functionality verified
- [ ] Performance acceptable

**Issues Encountered**: ____________________

**Resolution Applied**: ____________________

**Next Scheduled Maintenance**: ____________________

---

*Last Updated: $(date)*  
*Reference: PRODUCTION-DEPLOYMENT-GUIDE.md for detailed instructions*
