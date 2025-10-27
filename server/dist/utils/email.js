"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create email transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (options) => {
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
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};
exports.sendEmail = sendEmail;
const formatEmailAsHTML = (text) => {
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
exports.default = {
    sendEmail: exports.sendEmail,
};
//# sourceMappingURL=email.js.map