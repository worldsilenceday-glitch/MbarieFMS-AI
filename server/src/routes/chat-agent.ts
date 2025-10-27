import express from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { extractTextFromFile, validateFile, cleanupFile } from '../utils/fileProcessors';
import aiClient from '../utils/ai-client';
import emailRouter from '../utils/email-router';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10') * 1024 * 1024
  }
});

interface ChatRequest {
  message: string;
  userId?: string;
  userName?: string;
}

interface EmailDraft {
  subject: string;
  body: string;
  suggestedRecipients: string[];
}

interface ChatResponse {
  reply: string;
  draft?: EmailDraft;
  logId: number;
}

/**
 * POST /api/chat-agent
 * Accepts multipart form data with message and optional file
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { message, userId, userName } = req.body as ChatRequest;
    const file = req.file;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Validate file if present
    if (file) {
      const validation = validateFile(file);
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
        const extractionResult = await extractTextFromFile(file.path, file.mimetype);
        fileContent = extractionResult.text;
        fileSummary = extractionResult.summary;
        fileName = file.originalname;
        fileType = path.extname(file.originalname).toLowerCase();
        
        // For MVP, keep the file. In production, you might want to clean it up after processing
        // cleanupFile(file.path);
      } catch (error) {
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

    // Generate AI response with enhanced error handling
    let aiResponse;
    let providerUsed = 'unknown';
    let reply = '';
    
    try {
      aiResponse = await aiClient.generateResponse({
        system: systemPrompt,
        user: userPrompt
      });
      providerUsed = aiResponse.provider || 'deepseek';
      reply = aiResponse.content;
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Provide fallback response when AI services are unavailable
      reply = "I'm currently experiencing technical difficulties with our AI services. Please try again in a few moments, or contact our technical support team for assistance. In the meantime, you can:\n\n1. Check your internet connection\n2. Try sending your message again\n3. Contact support if the issue persists\n\nWe apologize for the inconvenience.";
      providerUsed = 'fallback';
      
      // Log the AI service failure
      await prisma.communicationLog.create({
        data: {
          userId: userId || undefined,
          userName: userName || undefined,
          role: 'system',
          type: 'chat',
          summary: 'AI service unavailable',
          content: `AI service error: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
          emailSent: false
        }
      });
    }

    // Parse response for email draft
    let emailDraft: EmailDraft | undefined;

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
    const hasEmailIntent = emailKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

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
    let draftLogId: number | undefined;
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
    const response: ChatResponse = {
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

  } catch (error) {
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
async function generateEmailDraft(
  message: string, 
  fileContent: string, 
  conversationContext: string
): Promise<EmailDraft | undefined> {
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

    const response = await aiClient.generateResponse({
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
  } catch (error) {
    console.error('Error generating email draft:', error);
  }

  return undefined;
}

/**
 * Get suggested recipients based on email content
 */
async function getSuggestedRecipients(draft: EmailDraft, userMessage: string): Promise<string[]> {
  try {
    // Use email router to determine recipients
    const recipients = await emailRouter.determineRecipients('general', {
      message: userMessage,
      draftSubject: draft.subject,
      draftBody: draft.body
    });

    return [...(recipients.to || []), ...(recipients.cc || [])];
  } catch (error) {
    console.error('Error determining recipients:', error);
    // Fallback to default recipients
    return ['goodluck.mbarie@mbarieservicesltd.com'];
  }
}

export default router;
