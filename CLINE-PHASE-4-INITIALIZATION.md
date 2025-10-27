# 🚀 Mbarie FMS AI - Phase 4 System Blueprint Execution

You are now entering **Phase 4** of the Mbarie FMS AI development lifecycle.  
Your goal is to transform the existing facility management platform into a **realtime, voice-enabled, memory-persistent AI system** with enterprise-grade admin controls.

---

## 🧠 SYSTEM CONTEXT
Mbarie FMS AI currently includes:
- AI Monitoring Agent + Automated Reports
- Interactive Chat Agent (voice + file + text)
- Smart Email Routing (based on organogram)
- Organizational intelligence mapping
- Full-stack Docker setup (client + server + db)

This blueprint adds **three advanced modules**:
1. **Advanced Admin Dashboard**
2. **Realtime Voice Engine**
3. **AI Memory System**

---

## 🧩 MODULE 1: Advanced Admin Dashboard

### 🎯 Goal
Provide HR, Operations, HSSE, and Management with real-time insight into facility activity, communication, and AI behavior.

### 🧰 Features
- Real-time system analytics dashboard (`/dashboard`)
- Visualized communication logs, AI performance, and monitoring metrics
- Role-based access (HR, Operations, Admin)
- Daily summary charts from AI logs
- Export reports as PDF or Excel

### ⚙️ Technical Requirements
- **Frontend**: New route `client/src/pages/AdminDashboard.tsx`
- **Backend**: `/api/dashboard/*` endpoints for analytics
- **DB Schema**:
  - Extend `CommunicationLog` and `MonitorLog` with performance and category fields
- **UI Libraries**: Recharts + Shadcn UI
- **Security**: Basic auth or JWT
- **Real-time updates**: Socket.IO or WebSockets integration

---

## 🗣️ MODULE 2: Realtime Voice Engine

### 🎯 Goal
Enable fully interactive, hands-free communication between users and the AI in the web interface.

### 🧰 Features
- **Streaming Speech Recognition** via OpenAI Realtime Voice API
- **Realtime AI speech output** (text-to-speech)
- **Voice Commands**:
  - "Send report to HR"
  - "Summarize today's safety briefing"
  - "Show me fabrication workshop attendance"

### ⚙️ Technical Requirements
- **Frontend**:
  - `useVoiceAgent.ts` hook for speech input/output
  - UI control for toggling voice chat
- **Backend**:
  - WebSocket or Realtime endpoint `/api/voice-agent`
  - Integrate OpenAI Realtime API via streaming websockets
- **Audio Handling**:
  - Web Audio API for output
  - Whisper API (optional) fallback for transcription

---

## 🧠 MODULE 3: AI Memory System

### 🎯 Goal
Give the AI long-term context about users, conversations, and facility patterns.

### 🧰 Features
- Persistent memory for each user and department
- Vector embeddings for historical chat and monitoring data
- Memory recall: AI remembers personnel, roles, and prior reports
- Searchable history across all interactions

### ⚙️ Technical Requirements
- **Vector Database**: Integrate with **Pinecone**, **Weaviate**, or **Supabase Vector**
- **Schema Extension**: `MemoryStore` table
- **Backend Routes**:
  - `/api/memory/save`
  - `/api/memory/query`
- **AI Context Builder**: Middleware that enriches GPT-4 prompts with memory embeddings

---

## ⚙️ SYSTEM INTEGRATION

### Environment
- Extend `.env.example` with:
  - `OPENAI_API_KEY`
  - `VECTOR_DB_URL`
  - `VOICE_API_KEY`
  - `JWT_SECRET`

### Docker Compose
- Add services:
  - `voice-service`
  - `vector-db`
- Expose necessary ports for dev/prod

### Testing
- Unit + Integration + Voice tests
- Performance monitoring with Lighthouse + Artillery
- Security audit of endpoints

---

## 🗓️ 6-WEEK IMPLEMENTATION ROADMAP

| Phase | Duration | Deliverables |
|-------|-----------|--------------|
| **1. Foundation** | Week 1–2 | API setup, DB schema, endpoints, memory base |
| **2. Core Features** | Week 3–5 | Dashboard UI, voice engine, memory persistence |
| **3. Polish & Deploy** | Week 6 | Docker optimization, CI/CD, testing, documentation |

---

## ✅ SUCCESS CRITERIA
- Realtime dashboard accessible by authorized roles
- Voice agent active and streaming both ways
- AI memory persists and retrieves context across sessions
- System fully containerized and production ready

---

## 🧭 NEXT STEPS
1. Initialize and verify current code health.
2. Begin **Phase 4** implementation based on this blueprint.
3. Generate a summary of file additions, migrations, and architecture decisions.
4. Once complete, prepare **Phase 5 Proposal** for integration with IoT sensors (Access Control + Workshop Systems).

---

# 🚀 Execute Phase 4
Begin now by:
1. Creating all new routes and schema updates.
2. Implementing the dashboard frontend with mock data.
3. Integrating OpenAI Realtime Voice API.
4. Adding memory persistence.

Document every stage inside `/docs/phase-4-progress.md`.
