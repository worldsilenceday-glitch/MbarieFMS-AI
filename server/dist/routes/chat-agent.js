"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const fileProcessors_1 = require("../utils/fileProcessors");
const ai_client_1 = __importDefault(require("../utils/ai-client"));
const email_router_1 = __importDefault(require("../utils/email-router"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: path_1.default.join(__dirname, '../../uploads'),
    limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10') * 1024 * 1024
    }
});
/**
 * POST /api/chat-agent
 * Accepts multipart form data with message and optional file
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { message, userId, userName } = req.body;
        const file = req.file;
        if (!message && !file) {
            return res.status(400).json({ error: 'Message or file is required' });
        }
        // Validate file if present
        if (file) {
            const validation = (0, fileProcessors_1.validateFile)(file);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.error });
            }
        }
        let fileContent = '';
        let fileSummary = '';
        let fileName = '';
        let fileType = '';
        // Process file if uploaded
        if (file) {
            try {
                const extractionResult = await (0, fileProcessors_1.extractTextFromFile)(file.path, file.mimetype);
                fileContent = extractionResult.text;
                fileSummary = extractionResult.summary;
                fileName = file.originalname;
                fileType = path_1.default.extname(file.originalname).toLowerCase();
                // For MVP, keep the file. In production, you might want to clean it up after processing
                // cleanupFile(file.path);
            }
            catch (error) {
                console.error('Error processing file:', error);
                return res.status(500).json({ error: 'Failed to process uploaded file' });
            }
        }
        // Get conversation context (last 5 messages)
        const recentMessages = await prisma.communicationLog.findMany({
            where: {
                userId: userId || undefined,
                type: { in: ['chat', 'file'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        // Build conversation context
        const conversationContext = recentMessages
            .reverse()
            .map(log => `${log.role}: ${log.content}`)
            .join('\n');
        // Build AI prompt
        const systemPrompt = `You are an AI assistant for Mbarie Services Ltd, a facility management and fabrication workshop company. Your role is to help with facility management, HSSE (Health, Safety, Security & Environment), and general business operations.

Key company contacts:
- General Manager: GoodLuck Mbarie
- Operations Manager: Thompson Aguheva  
- Workshop Manager: Haroon Ahmed Amin
- Safety Coordinator: Bristol Harry
- Materials Coordinator: Erasmus Hart Taribo
- Logistics Officer: Mandy Brown
- HR Generalist: Ufuoma Damilola-Ajewole

When users mention sending emails or notifications, detect the intent and provide an email draft with appropriate recipients based on the context.

If the user wants to send an email, provide a draft with:
- Clear subject line
- Professional email body
- Suggested recipients based on the content

Always be helpful, professional, and focused on facility management and business operations.`;
        let userPrompt = '';
        if (conversationContext) {
            userPrompt += `Previous conversation:\n${conversationContext}\n\n`;
        }
        userPrompt += `User message: ${message}`;
        if (fileContent) {
            userPrompt += `\n\nUploaded file content (${fileName}):\n${fileContent}\n\nFile summary: ${fileSummary}`;
        }
        userPrompt += `\n\nPlease provide a helpful response. If the user wants to send an email or notification, include an email draft with appropriate subject, body, and suggested recipients.`;
        // Generate AI response
        const aiResponse = await ai_client_1.default.generateResponse({
            system: systemPrompt,
            user: userPrompt
        });
        // Parse response for email draft
        let reply = aiResponse.content;
        let emailDraft;
        // Check if response contains email draft markers
        const emailDraftMatch = reply.match(/EMAIL DRAFT:?\s*(.*?)(?=\n\n|$)/s);
        if (emailDraftMatch) {
            const draftContent = emailDraftMatch[1];
            // Extract subject (first line after "Subject:")
            const subjectMatch = draftContent.match(/Subject:\s*(.+)/i);
            const bodyMatch = draftContent.match(/Body:\s*(.+)/is);
            if (subjectMatch && bodyMatch) {
                emailDraft = {
                    subject: subjectMatch[1].trim(),
                    body: bodyMatch[1].trim(),
                    suggestedRecipients: [] // Will be determined by email router
                };
                // Remove draft from main reply
                reply = reply.replace(/EMAIL DRAFT:?\s*.*?(?=\n\n|$)/s, '').trim();
            }
        }
        // Auto-detect email intent from keywords
        const emailKeywords = ['send email', 'email', 'notify', 'draft', 'contact', 'reach out'];
        const hasEmailIntent = emailKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
        if (hasEmailIntent && !emailDraft) {
            // Generate email draft based on context
            const draftResponse = await generateEmailDraft(message, fileContent, conversationContext);
            if (draftResponse) {
                emailDraft = draftResponse;
            }
        }
        // Log user message
        const userLog = await prisma.communicationLog.create({
            data: {
                userId: userId || undefined,
                userName: userName || undefined,
                role: 'user',
                type: file ? 'file' : 'chat',
                summary: file ? fileSummary : undefined,
                content: message,
                filePath: file ? file.path : undefined,
                fileName: file ? fileName : undefined,
                fileType: file ? fileType : undefined,
                emailSent: false
            }
        });
        // Log AI response
        const aiLog = await prisma.communicationLog.create({
            data: {
                userId: userId || undefined,
                userName: userName || undefined,
                role: 'ai',
                type: 'chat',
                summary: emailDraft ? 'Generated response with email draft' : 'Generated response',
                content: reply,
                emailSent: false
            }
        });
        // Log email draft if generated
        let draftLogId;
        if (emailDraft) {
            const draftLog = await prisma.communicationLog.create({
                data: {
                    userId: userId || undefined,
                    userName: userName || undefined,
                    role: 'ai',
                    type: 'email_draft',
                    summary: `Email draft: ${emailDraft.subject}`,
                    content: JSON.stringify(emailDraft),
                    emailSent: false
                }
            });
            draftLogId = draftLog.id;
        }
        // Prepare response
        const response = {
            reply,
            logId: aiLog.id
        };
        if (emailDraft && draftLogId) {
            response.draft = {
                ...emailDraft,
                suggestedRecipients: await getSuggestedRecipients(emailDraft, message)
            };
        }
        res.json(response);
    }
    catch (error) {
        console.error('Error in chat agent:', error);
        res.status(500).json({
            error: 'Failed to process chat request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Generate email draft based on context
 */
async function generateEmailDraft(message, fileContent, conversationContext) {
    try {
        const systemPrompt = `You are an email drafting assistant for Mbarie Services Ltd. Create professional email drafts based on user requests.`;
        const userPrompt = `
User request: ${message}
${fileContent ? `File content: ${fileContent}` : ''}
${conversationContext ? `Conversation context: ${conversationContext}` : ''}

Please create a professional email draft with:
1. A clear subject line
2. Professional email body
3. Appropriate tone for business communication

Format your response as:
Subject: [email subject]
Body: [email body content]
`;
        const response = await ai_client_1.default.generateResponse({
            system: systemPrompt,
            user: userPrompt
        });
        const subjectMatch = response.content.match(/Subject:\s*(.+)/i);
        const bodyMatch = response.content.match(/Body:\s*(.+)/is);
        if (subjectMatch && bodyMatch) {
            return {
                subject: subjectMatch[1].trim(),
                body: bodyMatch[1].trim(),
                suggestedRecipients: []
            };
        }
    }
    catch (error) {
        console.error('Error generating email draft:', error);
    }
    return undefined;
}
/**
 * Get suggested recipients based on email content
 */
async function getSuggestedRecipients(draft, userMessage) {
    try {
        // Use email router to determine recipients
        const recipients = await email_router_1.default.determineRecipients('general', {
            message: userMessage,
            draftSubject: draft.subject,
            draftBody: draft.body
        });
        return [...(recipients.to || []), ...(recipients.cc || [])];
    }
    catch (error) {
        console.error('Error determining recipients:', error);
        // Fallback to default recipients
        return ['goodluck.mbarie@mbarieservicesltd.com'];
    }
}
exports.default = router;
//# sourceMappingURL=chat-agent.js.map