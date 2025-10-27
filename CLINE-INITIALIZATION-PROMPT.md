# Cline AI Developer Agent - Initialization Prompt

**Copy and paste this entire prompt into your Cline AI Developer Agent in VS Code:**

---

## 🚀 **Cline AI Developer Agent - Mbarie FMS AI Project**

You are Cline, an autonomous AI developer agent. I'm handing over the **Mbarie FMS AI** project for you to continue development, optimize, and prepare for production deployment.

### **Project Context**

**Project Name**: `mbarie-fms-ai`  
**Current Status**: Phase 3 Complete - Interactive AI Chat System fully implemented  
**Primary Goal**: AI-powered facility management assistant with multimodal communication

### **📁 Project Structure**
```
mbarie-fms-ai/
├── .cline-intent.json          # Developer intent configuration
├── Dockerfile                  # Production server build
├── docker-compose.yml          # Multi-service deployment
├── client/                     # React + TypeScript + Vite frontend
│   ├── Dockerfile.dev          # Development client
│   ├── Dockerfile.prod         # Production client
│   ├── nginx.conf              # Production web server config
│   └── src/pages/ChatAgent.tsx # Main chat interface
├── server/                     # Node.js + Express + Prisma backend
│   ├── src/routes/chat-agent.ts
│   ├── src/routes/email-approval.ts
│   ├── src/utils/fileProcessors.ts
│   └── prisma/schema.prisma
└── ai-agent/                   # AI monitoring and automation
```

### **✅ Current Implementation Status**

**Core Features Working**:
- ✅ Real-time AI chat with context awareness
- ✅ Multimodal input (text, voice, file upload)
- ✅ File processing (PDF, DOCX, CSV, images with OCR)
- ✅ AI-generated email drafts with approval workflow
- ✅ Communication logging and analytics
- ✅ Voice I/O using Web Speech API
- ✅ Email automation with intelligent routing

**Database**: SQLite (development) → PostgreSQL (production ready)  
**AI Integration**: OpenAI GPT-4 with custom prompts  
**Authentication**: Basic JWT (needs enhancement)

### **🎯 Your Immediate Tasks**

1. **System Analysis & Optimization**
   - Analyze codebase for performance bottlenecks
   - Run linting and TypeScript checks
   - Verify all API endpoints are functional
   - Test Docker build process

2. **Production Readiness**
   - Configure environment variables for production
   - Set up database migrations for PostgreSQL
   - Implement proper error handling and logging
   - Add health checks and monitoring

3. **Testing & Validation**
   - Run existing test suite: `node test-chat-agent.js`
   - Test file upload functionality
   - Verify voice input/output in supported browsers
   - Test email draft generation and sending

4. **Deployment Preparation**
   - Validate Docker multi-stage builds
   - Test docker-compose setup
   - Prepare deployment scripts for Render/Vercel/Railway

### **🔧 Technical Stack**

**Frontend**: React + TypeScript + Vite + TailwindCSS  
**Backend**: Node.js + Express + Prisma + TypeScript  
**Database**: SQLite (dev) / PostgreSQL (prod)  
**AI**: OpenAI GPT-4 + Custom AI Client  
**Container**: Docker + Docker Compose  
**Email**: Nodemailer with company SMTP

### **🧪 Test Commands to Run**

```bash
# System verification
node test-chat-agent.js

# Docker build test
docker-compose build

# Database migration
cd server && npx prisma db push

# Development servers
cd server && npm run dev
cd client && npm run dev
```

### **📋 Next Development Phases**

**Phase 4 - Dashboard & Analytics**
- Admin dashboard for communication monitoring
- Real-time analytics and reporting
- User management and permissions

**Phase 5 - Advanced AI Features**
- Memory-aware context persistence
- Advanced voice processing (ElevenLabs/OpenAI Realtime)
- Predictive analytics for facility management

**Phase 6 - Enterprise Features**
- Multi-tenant architecture
- Advanced security and compliance
- Integration with external systems

### **🚨 Critical Checks Required**

1. **Environment Variables**: Verify `.env` setup with OpenAI API key
2. **File Uploads**: Test upload directory permissions
3. **Email Configuration**: Validate SMTP settings work
4. **Database**: Ensure PostgreSQL migration works
5. **CORS**: Verify client-server communication

### **🎛️ Available Scripts**

```bash
# Development
npm run dev (both client and server)

# Production build
npm run build (both client and server)

# Database
npx prisma studio
npx prisma db push
npx prisma generate
```

### **📞 Integration Points**

- **AI Monitoring Agent**: Already integrated in `ai-agent/monitor-agent.ts`
- **Email Router**: Intelligent recipient routing in `server/src/utils/email-router.ts`
- **File Processors**: Multi-format support in `server/src/utils/fileProcessors.ts`
- **Communication Logs**: Comprehensive logging in database

---

**Your Mission**: Take this project from "implementation complete" to "production ready" with autonomous testing, optimization, and deployment preparation. Use the `.cline-intent.json` file for context and follow modern development best practices.

**Start by running system verification and reporting any issues found.**
