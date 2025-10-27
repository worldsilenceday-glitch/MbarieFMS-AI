import { PrismaClient } from '@prisma/client';
import aiClient from './ai-client';

const prisma = new PrismaClient();

export interface EmailRecipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

export interface EmailContent {
  subject: string;
  body: string;
  recipients: EmailRecipients;
}

export const emailDirectory = {
  generalManager: { name: "GoodLuck Mbarie", email: "goodluck.mbarie@mbarieservicesltd.com" },
  operationsManager: { name: "Thompson Aguheva", email: "aguheva.thompson@mbarieservicesltd.com" },
  workshopManager: { name: "Haroon Ahmed Amin", email: "haroon.amin@mbarieservicesltd.com" },
  supervisor: { name: "Ayo Oso Ebenezer", email: "ayo.ebenezer@mbarieservicesltd.com" },
  safetyCoordinator: { name: "Bristol Harry", email: "bristol.harry@mbarieservicesltd.com" },
  materialsCoordinator: { name: "Erasmus Hart Taribo", email: "erasmus-hart.taribo@mbarieservicesltd.com" },
  logisticsOfficer: { name: "Mandy Brown", email: "mandy.brown@mbarieservicesltd.com" },
  hrGeneralist: { name: "Ufuoma Damilola-Ajewole", email: "ufuoma.damilolaajewole@mbarieservicesltd.com" },
};

// Define routing logic for automatic reporting
export function getReportRecipients(reportType: string) {
  switch (reportType) {
    case "safety":
    case "toolbox":
      return [emailDirectory.safetyCoordinator.email, emailDirectory.operationsManager.email, emailDirectory.generalManager.email];
    case "materials":
      return [emailDirectory.materialsCoordinator.email, emailDirectory.operationsManager.email, emailDirectory.generalManager.email];
    case "logistics":
      return [emailDirectory.logisticsOfficer.email, emailDirectory.operationsManager.email, emailDirectory.generalManager.email];
    case "attendance":
      return [emailDirectory.hrGeneralist.email, emailDirectory.operationsManager.email, emailDirectory.generalManager.email];
    case "fabrication":
      return [emailDirectory.workshopManager.email, emailDirectory.operationsManager.email, emailDirectory.generalManager.email];
    default:
      return [emailDirectory.generalManager.email];
  }
}

export class EmailRouter {
  private companyEmails = emailDirectory;

  async determineRecipients(reportType: string, data: any): Promise<EmailRecipients> {
    const systemPrompt = `You are an intelligent email routing system for Mbarie Services Ltd. Your role is to determine the appropriate recipients for different types of facility management reports.

Available departments and their responsibilities:
- General Management (${this.companyEmails.generalManager.email}): Strategic decisions, overall performance
- Operations (${this.companyEmails.operationsManager.email}): Facility operations, access control, daily activities
- Workshop (${this.companyEmails.workshopManager.email}): Fabrication workshop operations
- Safety (${this.companyEmails.safetyCoordinator.email}): HSSE compliance, safety protocols
- Materials (${this.companyEmails.materialsCoordinator.email}): Equipment, supplies management
- Logistics (${this.companyEmails.logisticsOfficer.email}): Transportation, logistics coordination
- HR (${this.companyEmails.hrGeneralist.email}): Employee attendance, personnel issues

Determine the appropriate recipients based on the report type and content.`;

    const userPrompt = `
Report Type: ${reportType}
Report Data: ${JSON.stringify(data, null, 2)}

Please analyze this report and determine which departments should receive it. Consider:
- Who needs to take action based on this information?
- Who needs to be informed for decision-making?
- Who is responsible for the areas covered in the report?

Return your response as a JSON object with this structure:
{
  "to": ["primary_recipient_email"],
  "cc": ["secondary_recipient_emails"],
  "bcc": ["management_email_if_needed"]
}

Only use the actual email addresses provided above.
`;

    try {
      const response = await aiClient.generateResponse({
        system: systemPrompt,
        user: userPrompt
      });

      // Parse the JSON response
      const recipients = JSON.parse(response.content);
      return recipients;
    } catch (error) {
      console.error('Error determining recipients with AI, using defaults:', error);
      
      // Fallback logic - use getReportRecipients function
      const recipients = getReportRecipients(reportType);
      return {
        to: recipients,
        cc: [this.companyEmails.generalManager.email],
        bcc: []
      };
    }
  }

  async generateEmailContent(reportType: string, data: any, aiAnalysis?: string): Promise<EmailContent> {
    const systemPrompt = `You are a professional email writer for Mbarie Services Ltd. Your role is to create clear, concise, and professional email content for facility management reports.

Company: Mbarie Services Ltd
Industry: Fabrication workshops and facility management

Write emails that are:
- Professional and business-appropriate
- Clear and easy to understand
- Action-oriented when needed
- Include key insights and recommendations
- Format for easy reading`;

    const userPrompt = `
Report Type: ${reportType}
Report Data: ${JSON.stringify(data, null, 2)}
${aiAnalysis ? `AI Analysis: ${aiAnalysis}` : ''}

Please generate:
1. A clear, descriptive subject line
2. Professional email body that includes:
   - Brief introduction
   - Key findings and statistics
   - Important observations
   - Recommendations or required actions
   - Professional closing

Format the email body with appropriate paragraphs and structure.
`;

    const response = await aiClient.generateResponse({
      system: systemPrompt,
      user: userPrompt
    });

    const recipients = await this.determineRecipients(reportType, data);

    // Extract subject from the response (first line)
    const lines = response.content.split('\n');
    const subject = lines[0].replace('Subject:', '').trim();
    const body = lines.slice(1).join('\n').trim();

    return {
      subject: subject || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - Mbarie Services Ltd`,
      body: body || response.content,
      recipients
    };
  }

  getDefaultRecipients(): EmailRecipients {
    return {
      to: [this.companyEmails.operationsManager.email],
      cc: [this.companyEmails.hrGeneralist.email],
      bcc: [this.companyEmails.generalManager.email]
    };
  }
}

export default new EmailRouter();
