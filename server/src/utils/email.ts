import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || formatEmailAsHTML(options.text),
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

const formatEmailAsHTML = (text: string): string => {
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
};

export default {
  sendEmail,
};
