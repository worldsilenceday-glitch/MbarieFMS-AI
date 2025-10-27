# Mbarie FMS AI - Facility Management & HSSE System

A comprehensive Facility Management and Health, Safety, Security & Environment (HSSE) system with AI-powered monitoring and reporting.

---

## Features

- **Fingerprint Access System** – Entry/exit logging per zone
- **Clock-In/Clock-Out Tracking** – Daily attendance and time tracking
- **HSSE Integration** – Toolbox Safety Meeting logging with PPE verification
- **Automated Reporting & Alerts** – Daily/weekly summary emails
- **AI Agent Monitoring** – Anomaly detection and smart alerts
- **Admin Dashboard** – Management dashboard with filters
- **Local + Cloud Hybrid Architecture** – Offline capability with cloud sync

---

## Tech Stack

- **Frontend:** React + TypeScript + TailwindCSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** OpenAI API
- **Email:** Nodemailer with company domain SMTP

---

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (or pnpm/yarn if you prefer)
- **PostgreSQL**: v13+ (or use Docker via `docker-compose`)
- **OpenAI API key** (for AI features)
- **SMTP credentials** (for emails)
- Optional on Windows: **Git Bash** or **WSL** for running shell scripts

---

## Quick Start

### 1) Setup

- macOS/Linux:

```bash
chmod +x setup.sh
./setup.sh
```

- Windows (PowerShell with Git Bash or WSL available):

```powershell
# Using Git Bash
bash ./setup.sh

# Or using WSL (if repository is accessible from WSL)
wsl bash ./setup.sh
```

If you cannot use Bash, install dependencies manually as described below.

### 2) Environment Variables

Copy the example and fill in required values:

```bash
cp .env.example .env
```

Key variables (see `.env.example` for the full list):

- `DATABASE_URL` – PostgreSQL connection string
- `OPENAI_API_KEY` – OpenAI API key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – SMTP credentials
- Any additional service keys used by the project

### 3) Database (Prisma)

```bash
# From repository root
cd server

# Generate Prisma Client
npx prisma generate

# Apply migrations (creates DB if needed)
npx prisma migrate dev

# Seed initial data (if applicable)
npx prisma db seed
```

### 4) Start Development Servers

- Separate terminals:

```bash
# Terminal 1 – Backend
cd server
npm run dev

# Terminal 2 – Frontend
cd client
npm run dev
```

- Or via Docker Compose (both services):

```bash
docker-compose up --build
```

---

## Project Structure

```
mbarie-fms-ai/
├── client/               # React Frontend
├── server/               # Express Backend (Prisma, routes, services)
├── ai-agent/             # Standalone AI logic layer (scripts/tools)
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── setup.sh
└── README.md
```

---

## AI Components

- `ai-agent/` – Standalone utilities for AI interactions (e.g., monitoring scripts, OpenAI client wrappers). Useful for offline tests and agents not coupled to the server lifecycle.
- `server/src/ai-services/` – Server-exposed AI endpoints and service logic consumed by the app.
- `server/src/ai-agent/` – Server-side monitoring/agent processes coordinated with backend data.

Example test scripts in root may require `OPENAI_API_KEY`:

```bash
node test-chat-agent.js
node test-phase5.js
```

---

## Common Tasks

- **Lint/Format**: run the client/server project-specific scripts if available (e.g., `npm run lint`, `npm run format`).
- **Regenerate Prisma Client** after schema changes:

```bash
cd server
npx prisma generate
```

- **Apply new DB migrations**:

```bash
cd server
npx prisma migrate dev
```

---

## Troubleshooting

- On Windows, if shell scripts fail, use Git Bash or WSL, or run the underlying commands manually.
- Ensure PostgreSQL is running and `DATABASE_URL` is correct.
- If `npm run dev` fails in the server, regenerate Prisma Client and re-run migrations.
- Check that `OPENAI_API_KEY` and SMTP credentials are set before testing AI or email features.

---

## Contributing

Contributions are welcome. Please open an issue describing your change before submitting a PR. Include tests and follow project code style.

---

## License

Add your license of choice (e.g., MIT) in a `LICENSE` file and reference it here.
