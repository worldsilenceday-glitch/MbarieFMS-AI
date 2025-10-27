"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerManualMonitoring = exports.startMonitoringAgent = void 0;
const node_cron_1 = require("node-cron");
const axios_1 = __importDefault(require("axios"));
const client_1 = __importDefault(require("../db/client"));
// Import existing email utilities
const email_1 = require("../utils/email");
// 🧠 Core Monitoring Logic
const startMonitoringAgent = () => {
    console.log('🤖 Mbarie AI Monitoring Agent active...');
    // Run every 6 hours for continuous monitoring
    (0, node_cron_1.schedule)('0 */6 * * *', async () => {
        console.log('🕒 Running scheduled monitoring task...');
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            // Get reports from today
            const reports = await client_1.default.report.findMany({
                where: {
                    generatedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            // Get today's alerts for anomaly detection
            const alerts = await client_1.default.alert.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                include: {
                    user: true,
                },
            });
            // Get facility statistics for today
            const accessLogs = await client_1.default.accessLog.count({
                where: {
                    timestamp: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            const clockIns = await client_1.default.clockIn.count({
                where: {
                    timestamp: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            const toolboxMeetings = await client_1.default.toolboxMeeting.count({
                where: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            // 🧠 Use AI to analyze system health and generate insights
            const monitoringPrompt = `
        You are an HSSE monitoring AI for Mbarie Services.
        Analyze the following facility management data and provide:
        
        **System Overview:**
        - Total Reports Today: ${reports.length}
        - Total Alerts Today: ${alerts.length}
        - Access Logs: ${accessLogs}
        - Clock-ins: ${clockIns}
        - Toolbox Meetings: ${toolboxMeetings}

        **Alerts Summary:**
        ${alerts.map((alert) => `
          - ${alert.type}: ${alert.description} (Severity: ${alert.severity})
        `).join('')}

        **Reports Summary:**
        ${reports.map((report) => `
          - ${report.type} report for ${report.period}: ${report.status}
        `).join('')}

        **Please provide:**
        1. Overall system health assessment
        2. Key safety observations
        3. Recommendations for management
        4. Any missing or incomplete data that needs attention

        Keep the summary concise and actionable for facility management.
      `;
            const aiResponse = await axios_1.default.post('https://api.deepseek.com/v1/chat/completions', {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a proactive HSSE monitoring agent for facility management. Provide clear, actionable insights.' },
                    { role: 'user', content: monitoringPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            const summary = aiResponse.data.choices[0]?.message?.content || 'No summary generated.';
            // Log summary to database (we'll create this model next)
            await client_1.default.monitorLog.create({
                data: {
                    summary,
                    reportCount: reports.length,
                    alertCount: alerts.length,
                    accessLogCount: accessLogs,
                    clockInCount: clockIns,
                    toolboxMeetingCount: toolboxMeetings,
                    createdAt: new Date(),
                },
            });
            // Send to management emails (simplified routing for now)
            const recipients = ['goodluck.mbarie@mbarieservicesltd.com', 'aguheva.thompson@mbarieservicesltd.com'];
            // Format email content
            const emailContent = `
🤖 Mbarie AI Monitoring Summary
📅 ${new Date().toLocaleDateString()}
⏰ ${new Date().toLocaleTimeString()}

📊 System Statistics:
• Reports Generated: ${reports.length}
• Active Alerts: ${alerts.length}
• Access Logs: ${accessLogs}
• Clock-ins: ${clockIns}
• Toolbox Meetings: ${toolboxMeetings}

🧠 AI Analysis:
${summary}

---
This is an automated monitoring report from Mbarie FMS AI System.
      `.trim();
            await (0, email_1.sendEmail)({
                to: recipients,
                subject: '🤖 Mbarie AI - Daily Monitoring Summary',
                text: emailContent,
            });
            console.log('✅ Monitoring summary dispatched successfully.');
            console.log(`📊 Summary: ${reports.length} reports, ${alerts.length} alerts analyzed`);
        }
        catch (error) {
            console.error('❌ Error in monitoring agent:', error);
            // Log error to database
            await client_1.default.monitorLog.create({
                data: {
                    summary: `Monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    reportCount: 0,
                    alertCount: 0,
                    accessLogCount: 0,
                    clockInCount: 0,
                    toolboxMeetingCount: 0,
                    createdAt: new Date(),
                },
            });
        }
    });
    // Additional scheduled tasks for different monitoring frequencies
    // Daily comprehensive report at 8 AM
    (0, node_cron_1.schedule)('0 8 * * *', async () => {
        console.log('📋 Running daily comprehensive monitoring...');
        // This could trigger the existing daily report generation
    });
    // Weekly summary every Monday at 9 AM
    (0, node_cron_1.schedule)('0 9 * * 1', async () => {
        console.log('📅 Running weekly monitoring summary...');
        // Weekly analysis and reporting
    });
};
exports.startMonitoringAgent = startMonitoringAgent;
// Manual trigger function for testing
const triggerManualMonitoring = async () => {
    console.log('🔧 Manually triggering monitoring agent...');
    await (0, exports.startMonitoringAgent)();
};
exports.triggerManualMonitoring = triggerManualMonitoring;
exports.default = {
    startMonitoringAgent: exports.startMonitoringAgent,
    triggerManualMonitoring: exports.triggerManualMonitoring,
};
//# sourceMappingURL=monitor-agent.js.map