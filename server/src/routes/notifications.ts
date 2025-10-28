import express from 'express';
import { sendEmail } from '../utils/email';

const router = express.Router();

/**
 * POST /api/notifications/webhook
 * Auto-email webhook for system notifications
 * 
 * Triggered by:
 * - New user registration
 * - Document uploads
 * - Task completion
 * - Deployment success/failure
 * - System alerts
 */
router.post('/webhook', async (req, res) => {
  try {
    const { 
      eventType, 
      subject, 
      message, 
      priority = 'normal',
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!eventType || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventType, subject, message'
      });
    }

    // Determine email recipients based on event type
    const recipients = getRecipientsForEvent(eventType, metadata);
    
    // Format email content based on priority
    const formattedMessage = formatNotificationMessage(eventType, message, metadata, priority);
    
    // Send email notification
    const emailSent = await sendEmail({
      to: recipients,
      subject: `[Mbarie FMS AI] ${subject}`,
      text: formattedMessage,
      html: formatEmailAsHTML(formattedMessage, eventType, priority)
    });

    if (emailSent) {
      console.log(`✅ Notification sent for event: ${eventType}`);
      
      // Log notification for monitoring
      logNotification({
        eventType,
        subject,
        recipients,
        priority,
        timestamp: new Date().toISOString(),
        metadata
      });

      res.json({
        success: true,
        message: 'Notification sent successfully',
        eventType,
        recipients,
        priority
      });
    } else {
      throw new Error('Failed to send email');
    }

  } catch (error) {
    console.error('❌ Error in notification webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/notifications/health
 * Health check for notification service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Notification Webhook',
    timestamp: new Date().toISOString(),
    features: [
      'Auto-email notifications',
      'Event-based routing',
      'Priority handling',
      'System monitoring'
    ]
  });
});

/**
 * POST /api/notifications/test
 * Test endpoint to verify email functionality
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    const testEmailSent = await sendEmail({
      to: email || 'haroon.amin@mbarieservicesltd.com',
      subject: 'Mbarie FMS AI - Test Notification',
      text: `This is a test notification from Mbarie FMS AI system.\n\nTimestamp: ${new Date().toISOString()}\nSystem: Production Deployment\nStatus: ✅ Operational`
    });

    if (testEmailSent) {
      res.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } else {
      throw new Error('Failed to send test email');
    }
  } catch (error) {
    console.error('❌ Test notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test notification failed'
    });
  }
});

// Helper functions

function getRecipientsForEvent(eventType: string, metadata: any): string[] {
  const defaultRecipient = 'haroon.amin@mbarieservicesltd.com';
  
  switch (eventType) {
    case 'user_registration':
      return [defaultRecipient, 'admin@mbarieservicesltd.com'];
    
    case 'document_upload':
      return [defaultRecipient, 'operations@mbarieservicesltd.com'];
    
    case 'task_completed':
      return [defaultRecipient, metadata.assignedTo || 'team@mbarieservicesltd.com'];
    
    case 'deployment_success':
      return [defaultRecipient, 'devops@mbarieservicesltd.com'];
    
    case 'deployment_failure':
      return [defaultRecipient, 'devops@mbarieservicesltd.com', 'admin@mbarieservicesltd.com'];
    
    case 'system_alert':
      return [defaultRecipient, 'admin@mbarieservicesltd.com', 'support@mbarieservicesltd.com'];
    
    case 'maintenance_required':
      return [defaultRecipient, 'maintenance@mbarieservicesltd.com'];
    
    default:
      return [defaultRecipient];
  }
}

function formatNotificationMessage(
  eventType: string, 
  message: string, 
  metadata: any, 
  priority: string
): string {
  const timestamp = new Date().toISOString();
  const priorityLabel = priority.toUpperCase();
  
  let formattedMessage = `🔔 ${priorityLabel} NOTIFICATION\n\n`;
  formattedMessage += `Event: ${eventType}\n`;
  formattedMessage += `Time: ${timestamp}\n\n`;
  formattedMessage += `${message}\n\n`;
  
  if (metadata && Object.keys(metadata).length > 0) {
    formattedMessage += `Additional Details:\n`;
    Object.entries(metadata).forEach(([key, value]) => {
      formattedMessage += `- ${key}: ${value}\n`;
    });
  }
  
  formattedMessage += `\n---\nMbarie FMS AI System\nAutomated Notification`;
  
  return formattedMessage;
}

function formatEmailAsHTML(message: string, eventType: string, priority: string): string {
  const priorityColors: Record<string, string> = {
    high: '#dc3545',
    normal: '#007bff',
    low: '#28a745'
  };
  
  const color = priorityColors[priority] || '#007bff';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .priority { background: ${color}; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
          .content { padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0; }
          .metadata { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mbarie Services Ltd</h1>
          <h2>Facility Management System AI</h2>
          <div class="priority">${priority.toUpperCase()} PRIORITY</div>
        </div>
        <div class="content">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <div class="footer">
          <p>This is an automated notification from Mbarie FMS AI System</p>
          <p>Event Type: ${eventType} | Generated: ${new Date().toISOString()}</p>
        </div>
      </body>
    </html>
  `;
}

function logNotification(notification: any) {
  console.log('📧 Notification Log:', {
    timestamp: notification.timestamp,
    eventType: notification.eventType,
    recipients: notification.recipients,
    priority: notification.priority,
    metadata: notification.metadata
  });
  
  // In production, you might want to store this in a database
  // or send to a logging service
}

export default router;
