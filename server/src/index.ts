import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import accessRoutes from './routes/access';
import toolboxRoutes from './routes/toolbox';
import reportRoutes from './routes/reports';
import chatAgentRoutes from './routes/chat-agent';
import emailApprovalRoutes from './routes/email-approval';
import communicationRoutes from './routes/communication';
import notificationRoutes from './routes/notifications';

// Phase 5 Routes
import orgRoutes from './routes/org';
import permitRoutes from './routes/permit';
import documentRoutes from './routes/document';
import materialsRoutes from './routes/materials';
import hsseRoutes from './routes/hsse';

// Phase 6 AI Services
import aiServicesRoutes from './routes/ai-services';

// AI Monitoring Agent
import { startMonitoringAgent } from './ai-agent/monitor-agent';

// Phase 8.5 Monitoring & Scaling
import healthRoutes from './routes/health';
import { startScheduler } from './cron/scheduler';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/toolbox', toolboxRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat-agent', chatAgentRoutes);
app.use('/api/email-approval', emailApprovalRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/notifications', notificationRoutes);

// Phase 5 Routes
app.use('/api/org', orgRoutes);
app.use('/api/permit', permitRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/hsse', hsseRoutes);

// Phase 6 AI Services
app.use('/api/ai', aiServicesRoutes);

// Phase 8.5 Monitoring & Scaling
app.use('/api/system', healthRoutes);

// Health check (legacy - kept for backward compatibility)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Manual monitoring trigger for testing
app.post('/api/monitor/trigger', async (req, res) => {
  try {
    const { triggerManualMonitoring } = await import('./ai-agent/monitor-agent');
    await triggerManualMonitoring();
    res.json({ 
      status: 'success', 
      message: 'Monitoring agent triggered manually',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering monitoring:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to trigger monitoring agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Start AI Monitoring Agent
  startMonitoringAgent();
  
  // Start Phase 8.5 Monitoring Scheduler
  startScheduler();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
