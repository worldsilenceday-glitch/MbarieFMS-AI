import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import aiClient from './openai-client';
import emailRouter from './email-router';

const prisma = new PrismaClient();

export class FacilityMonitor {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async checkForAnomalies(date: Date = new Date()): Promise<any[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const anomalies = [];

    // Check for missing clock-outs
    const clockIns = await prisma.clockIn.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        },
        type: 'clock_in'
      },
      include: {
        user: true
      }
    });

    for (const clockIn of clockIns) {
      const clockOut = await prisma.clockIn.findFirst({
        where: {
          userId: clockIn.userId,
          timestamp: {
            gte: clockIn.timestamp,
            lt: endDate
          },
          type: 'clock_out'
        }
      });

      if (!clockOut) {
        anomalies.push({
          type: 'missing_clock_out',
          userId: clockIn.userId,
          userName: `${clockIn.user.firstName} ${clockIn.user.lastName}`,
          facility: clockIn.facility,
          description: `${clockIn.user.firstName} ${clockIn.user.lastName} clocked in but did not clock out`,
          severity: 'medium'
        });
      }
    }

    // Check for employees without toolbox meetings
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true }
    });

    for (const user of activeUsers) {
      const toolboxMeeting = await prisma.toolboxMeeting.findFirst({
        where: {
          attendees: {
            has: user.id
          },
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      });

      if (!toolboxMeeting) {
        anomalies.push({
          type: 'missed_toolbox',
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          facility: user.facility,
          description: `${user.firstName} ${user.lastName} did not attend any toolbox meeting today`,
          severity: 'low'
        });
      }
    }

    // Check for unusual access patterns
    const accessLogs = await prisma.accessLog.groupBy({
      by: ['userId', 'direction'],
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      }
    });

    for (const log of accessLogs) {
      if (log._count.id > 10) { // More than 10 entries/exits might be unusual
        const user = await prisma.user.findUnique({
          where: { id: log.userId }
        });

        if (user) {
          anomalies.push({
            type: 'unusual_access_pattern',
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            facility: log.facility,
            description: `${user.firstName} ${user.lastName} has ${log._count.id} ${log.direction} logs today (unusually high)`,
            severity: 'low'
          });
        }
      }
    }

    return anomalies;
  }

  async generateDailyReport(date: Date = new Date()): Promise<any> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get daily statistics
    const totalAccessLogs = await prisma.accessLog.count({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const totalClockIns = await prisma.clockIn.count({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const totalToolboxMeetings = await prisma.toolboxMeeting.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    const anomalies = await this.checkForAnomalies(date);

    const reportData = {
      date: date.toISOString().split('T')[0],
      summary: {
        totalAccessLogs,
        totalClockIns,
        totalToolboxMeetings,
        activeUsers,
        anomaliesCount: anomalies.length
      },
      anomalies,
      facilityStats: await this.getFacilityStats(startDate, endDate),
      toolboxStats: await this.getToolboxStats(startDate, endDate)
    };

    // Generate AI analysis
    const aiAnalysis = await aiClient.analyzeData(reportData, 'daily_report');

    return {
      ...reportData,
      aiAnalysis
    };
  }

  async getFacilityStats(startDate: Date, endDate: Date) {
    return await prisma.accessLog.groupBy({
      by: ['facility'],
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      }
    });
  }

  async getToolboxStats(startDate: Date, endDate: Date) {
    const total = await prisma.toolboxMeeting.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const ppeVerified = await prisma.toolboxMeeting.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        },
        ppeVerified: true
      }
    });

    return {
      total,
      ppeVerified,
      ppePercentage: total > 0 ? (ppeVerified / total * 100).toFixed(1) : 0
    };
  }

  async sendEmailReport(reportType: string, data: any, aiAnalysis?: string): Promise<boolean> {
    try {
      const emailContent = await emailRouter.generateEmailContent(reportType, data, aiAnalysis);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailContent.recipients.to.join(', '),
        cc: emailContent.recipients.cc?.join(', '),
        bcc: emailContent.recipients.bcc?.join(', '),
        subject: emailContent.subject,
        text: emailContent.body,
        html: this.formatEmailAsHTML(emailContent.body)
      };

      await this.transporter.sendMail(mailOptions);
      
      // Save report to database
      await prisma.report.create({
        data: {
          type: reportType,
          period: data.date || new Date().toISOString().split('T')[0],
          data: data,
          sentTo: [
            ...emailContent.recipients.to,
            ...(emailContent.recipients.cc || []),
            ...(emailContent.recipients.bcc || [])
          ],
          status: 'sent'
        }
      });

      console.log(`✅ ${reportType} report sent successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending ${reportType} report:`, error);
      
      // Save failed report
      await prisma.report.create({
        data: {
          type: reportType,
          period: data.date || new Date().toISOString().split('T')[0],
          data: data,
          sentTo: [],
          status: 'failed'
        }
      });

      return false;
    }
  }

  private formatEmailAsHTML(text: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
            .stat { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #2c5aa0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mbarie Services Ltd</h1>
            <h2>Facility Management Report</h2>
          </div>
          <div class="content">
            ${text.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>This is an automated report from Mbarie FMS AI System</p>
          </div>
        </body>
      </html>
    `;
  }

  async runDailyMonitoring(): Promise<void> {
    console.log('🚀 Starting daily monitoring...');
    
    try {
      const report = await this.generateDailyReport();
      await this.sendEmailReport('daily', report, report.aiAnalysis);
      
      // Create alerts for anomalies
      for (const anomaly of report.anomalies) {
        await prisma.alert.create({
          data: {
            type: anomaly.type,
            userId: anomaly.userId,
            facility: anomaly.facility,
            description: anomaly.description,
            severity: anomaly.severity
          }
        });
      }

      console.log('✅ Daily monitoring completed successfully');
    } catch (error) {
      console.error('❌ Error in daily monitoring:', error);
    }
  }
}

// Export singleton instance
export default new FacilityMonitor();
