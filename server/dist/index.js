"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const access_1 = __importDefault(require("./routes/access"));
const toolbox_1 = __importDefault(require("./routes/toolbox"));
const reports_1 = __importDefault(require("./routes/reports"));
const chat_agent_1 = __importDefault(require("./routes/chat-agent"));
const email_approval_1 = __importDefault(require("./routes/email-approval"));
const communication_1 = __importDefault(require("./routes/communication"));
// Phase 5 Routes
const org_1 = __importDefault(require("./routes/org"));
const permit_1 = __importDefault(require("./routes/permit"));
const document_1 = __importDefault(require("./routes/document"));
const materials_1 = __importDefault(require("./routes/materials"));
const hsse_1 = __importDefault(require("./routes/hsse"));
// Phase 6 AI Services
const ai_services_1 = __importDefault(require("./routes/ai-services"));
// AI Monitoring Agent
const monitor_agent_1 = require("./ai-agent/monitor-agent");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/access', access_1.default);
app.use('/api/toolbox', toolbox_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/chat-agent', chat_agent_1.default);
app.use('/api/email-approval', email_approval_1.default);
app.use('/api/communication', communication_1.default);
// Phase 5 Routes
app.use('/api/org', org_1.default);
app.use('/api/permit', permit_1.default);
app.use('/api/document', document_1.default);
app.use('/api/materials', materials_1.default);
app.use('/api/hsse', hsse_1.default);
// Phase 6 AI Services
app.use('/api/ai', ai_services_1.default);
// Health check
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
        const { triggerManualMonitoring } = await Promise.resolve().then(() => __importStar(require('./ai-agent/monitor-agent')));
        await triggerManualMonitoring();
        res.json({
            status: 'success',
            message: 'Monitoring agent triggered manually',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error triggering monitoring:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to trigger monitoring agent',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
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
    (0, monitor_agent_1.startMonitoringAgent)();
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await prisma.$disconnect();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map