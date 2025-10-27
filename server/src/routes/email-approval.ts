import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email';
import { getReportRecipients } from '../utils/email-router';

const router = express.Router();
const prisma = new PrismaClient();

interface EmailApprovalRequest {
  logId: number;
  approved: boolean;
  overrideRecipients?: string[];
  finalBody?: string;
}

interface EmailApprovalResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  recipients?: string[];
}

/**
 * POST /api/email-approval/confirm
 * Handle user approval/rejection of email drafts
 */
router.post('/confirm', async (req, res) => {
  try {
    const { logId, approved, overrideRecipients, finalBody }: EmailApprovalRequest = req.body;

    if (!logId) {
      return res.status(400).json({ error: 'logId is required' });
    }

    // Find the email draft log entry
    const draftLog = await prisma.communicationLog.findUnique({
      where: { id: logId }
    });

    if (!draftLog) {
      return res.status(404).json({ error: 'Email draft not found' });
    }

    if (draftLog.type !== 'email_draft') {
      return res.status(400).json({ error: 'Log entry is not an email draft' });
    }

    let response: EmailApprovalResponse;

    if (approved) {
      // Send the email
      response = await handleEmailApproval(draftLog, overrideRecipients, finalBody);
    } else {
      // Mark as rejected
      response = await handleEmailRejection(draftLog, finalBody);
    }

    res.json(response);

  } catch (error) {
    console.error('Error in email approval:', error);
    res.status(500).json({ 
      error: 'Failed to process email approval',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Handle approved email - send it
 */
async function handleEmailApproval(
  draftLog: any,
  overrideRecipients?: string[],
  finalBody?: string
): Promise<EmailApprovalResponse> {
  try {
    // Parse the email draft data
    let draftData;
    try {
      draftData = JSON.parse(draftLog.content || '{}');
    } catch (error) {
      return {
        success: false,
        message: 'Invalid email draft format'
      };
    }

    const { subject, body, suggestedRecipients } = draftData;

    if (!subject || !body) {
      return {
        success: false,
        message: 'Email draft missing subject or body'
      };
    }

    // Determine recipients
    let recipients: string[];
    if (overrideRecipients && overrideRecipients.length > 0) {
      recipients = overrideRecipients;
    } else if (suggestedRecipients && suggestedRecipients.length > 0) {
      recipients = suggestedRecipients;
    } else {
      // Fallback to default recipients
      recipients = getReportRecipients('general');
    }

    // Use final body if provided, otherwise use draft body
    const emailBody = finalBody || body;

    // Send the email
    const emailSent = await sendEmail({
      to: recipients,
      subject: subject,
      text: emailBody,
      html: formatEmailAsHTML(emailBody)
    });

    // Update the log entry
    await prisma.communicationLog.update({
      where: { id: draftLog.id },
      data: {
        emailSent: emailSent,
        content: JSON.stringify({
          ...draftData,
          finalBody: finalBody || body,
          recipients: recipients,
          sentAt: new Date().toISOString()
        })
      }
    });

    if (emailSent) {
      return {
        success: true,
        message: 'Email sent successfully',
        emailSent: true,
        recipients: recipients
      };
    } else {
      return {
        success: false,
        message: 'Failed to send email',
        emailSent: false,
        recipients: recipients
      };
    }

  } catch (error) {
    console.error('Error sending approved email:', error);
    return {
      success: false,
      message: 'Error sending email: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Handle rejected email - mark as rejected
 */
async function handleEmailRejection(
  draftLog: any,
  finalBody?: string
): Promise<EmailApprovalResponse> {
  try {
    // Update the log entry to mark as rejected
    await prisma.communicationLog.update({
      where: { id: draftLog.id },
      data: {
        emailSent: false,
        summary: `Email draft rejected${finalBody ? ' (user modified)' : ''}`,
        content: JSON.stringify({
          ...JSON.parse(draftLog.content || '{}'),
          status: 'rejected',
          finalBody: finalBody || null,
          rejectedAt: new Date().toISOString()
        })
      }
    });

    return {
      success: true,
      message: finalBody ? 'Email draft saved with modifications' : 'Email draft rejected',
      emailSent: false
    };

  } catch (error) {
    console.error('Error handling email rejection:', error);
    return {
      success: false,
      message: 'Error processing rejection: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Format email body as HTML
 */
function formatEmailAsHTML(text: string): string {
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
          <h2>Facility Management System</h2>
        </div>
        <div class="content">
          ${text.replace(/\n/g, '<br>')}
        </div>
        <div class="footer">
          <p>This is an automated email from Mbarie FMS AI System</p>
        </div>
      </body>
    </html>
  `;
}

export default router;
