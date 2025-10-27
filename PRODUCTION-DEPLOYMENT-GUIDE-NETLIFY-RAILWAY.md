# Mbarie FMS AI - Production Deployment Guide (Netlify + Railway)

This guide provides step-by-step instructions to deploy the Mbarie FMS AI system to production using Netlify (front-end) and Railway (back-end).

## 🎯 Deployment Goals

- **Front-end**: New branded site at `https://mbarie-fms.netlify.app` (custom domain: `fms.mbarieservicesltd.com`)
- **Back-end**: Railway deployment at `https://api.mbarie-fms.up.railway.app`
- **Features**: Light/dark toggle, staff authentication, Contact-IT page
- **CI/CD**: Auto-deploy on every `git push main`

## 📁 Project Structure

```
root
├─ client/          ← React+Vite (Netlify)
├─ server/          ← Express+Prisma (Railway)
├─ netlify.toml     ← Netlify build config
└─ railway.toml     ← Railway deployment config
```

## 🚀 Quick Deployment Commands

### 1. Install Railway CLI (one-time setup)
```bash
npm install -g @railway/cli
```

### 2. Deploy Back-end to Railway
```bash
# Inside repo root
railway login
railway init  # Choose "New Project" → name "mbarie-fms-api"
railway add --service
railway up
```

### 3. Deploy Front-end to Netlify
```bash
# Already configured via dashboard (no CLI needed)
# Just push to GitHub and connect in Netlify dashboard
```

## 📋 Netlify Dashboard Setup

### 1. Import from GitHub
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import from Git"
3. Select GitHub repo `mbarie-fms-ai`

### 2. Build Settings
- **Base directory**: `client`
- **Build command**: `npm run build`
- **Publish directory**: `client/dist`

### 3. Environment Variables (UI)
Add these variables in Netlify dashboard:
```
VITE_SERVER_URL = https://api.mbarie-fms.up.railway.app
VITE_OPENAI_KEY = <your-openai-key>
VITE_DEEPSEEK_KEY = <your-deepseek-key>
VITE_COMPANY_LOGO = /logo.svg
VITE_COMPANY_LOGO_WHITE = /logo-white.svg
```

### 4. Custom Domain (Optional)
- Go to Domain settings → "Set custom domain"
- Enter: `fms.mbarieservicesltd.com`

## 📋 Railway Dashboard Setup

### 1. Create Project
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select same repo `mbarie-fms-ai`

### 2. Environment Variables
Add these variables in Railway dashboard:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<PostgreSQL-connect-string>  (Railway provides)
JWT_SECRET=<random-32-chars>
OPENAI_API_KEY=<your-openai-key>
DEEPSEEK_API_KEY=<your-deepseek-key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<your-gmail>
SMTP_PASS=<app-password>
```

### 3. Generate Domain
- Go to Settings → Domains → "Generate Domain"
- Copy: `https://api.mbarie-fms.up.railway.app`

## 🔄 CI/CD Auto-Deploy

Already enabled by default when you connect GitHub in both dashboards:
- Every push to `main` branch rebuilds front-end **and** back-end independently
- Zero-downtime deployments
- Automatic health checks

## ✅ Post-Deployment QA Checklist

- [ ] Front-end loads at new Netlify URL with blue header & logo
- [ ] Light/dark toggle persists after reload
- [ ] Register with haroon@mbarieservicesltd.com → role = Admin
- [ ] Login succeeds → cookie visible in Application tab (httpOnly)
- [ ] Contact-IT form sends email to support@mbarieservicesltd.com
- [ ] AI Chat (voice + file) still answers
- [ ] Predictive maintenance graph renders
- [ ] Inventory CRUD works
- [ ] Console = 0 errors, 0 warnings
- [ ] Build badge green on both dashboards

## 🎨 Branding Details

- **Primary Color**: #0B4D91 (Blue)
- **Secondary Color**: #FF9C2A (Orange)
- **Logo**: 200×40 SVG with Mbarie branding
- **Theme**: Light/dark mode with persistence

## 🔧 Technical Stack

### Front-end (Netlify)
- React 18 + TypeScript
- Vite build system
- Tailwind CSS with custom colors
- React Router for navigation
- JWT authentication with cookies

### Back-end (Railway)
- Node.js + Express
- TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication
- Nodemailer for emails
- CORS enabled for Netlify domain

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails on Netlify**
   - Check Node version (18+ required)
   - Verify build command: `cd client && npm run build`

2. **Back-end not connecting**
   - Verify Railway environment variables
   - Check DATABASE_URL is set
   - Ensure CORS allows Netlify domain

3. **Authentication issues**
   - Verify JWT_SECRET is set in Railway
   - Check cookie settings in browser

4. **Email not sending**
   - Verify SMTP credentials in Railway
   - Check Gmail app password is correct

## 📞 Support

For deployment issues:
1. Check Railway logs in dashboard
2. Check Netlify build logs
3. Verify all environment variables are set
4. Test API endpoints directly

---

**Your new branded, staff-registerable, light/dark-switchable Mbarie FMS AI will be live at:**
- Front-end: `https://fms.mbarie-fms.netlify.app` (or custom domain)
- Back-end: `https://api.mbarie-fms.up.railway.app`

Every `git push main` auto-deploys both sides!
