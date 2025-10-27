# Chat Agent System - Test Instructions

This document provides step-by-step instructions for testing the Interactive AI Chat System implementation.

## Prerequisites

1. **Environment Setup**:
   - Ensure all dependencies are installed:
     ```bash
     cd server && npm install
     cd ../client && npm install
     ```

2. **Environment Variables**:
   - Copy `.env.example` to `.env` in the root directory
   - Set required environment variables:
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration
     - `DATABASE_URL` - Database connection string

3. **Database Setup**:
   ```bash
   cd server
   npx prisma db push
   ```

## Test Steps

### 1. Start the Application

**Terminal 1 - Server**:
```bash
cd server
npm run dev
```

**Terminal 2 - Client**:
```bash
cd client
npm run dev
```

### 2. Basic Chat Functionality Test

1. **Open the Chat Interface**:
   - Navigate to `http://localhost:5173/chat-agent` (or the appropriate route)
   - You should see the chat interface with an empty message list

2. **Send a Text Message**:
   - Type: "Hello, can you help me with facility management?"
   - Click "Send" or press Enter
   - Verify: AI response appears with proper formatting

3. **Test Conversation Context**:
   - Send follow-up message: "What safety protocols should we implement?"
   - Verify: AI maintains context from previous messages

### 3. File Upload Test

1. **Upload a PDF File**:
   - Click "Attach" button
   - Select a sample PDF file (under 10MB)
   - Add a message: "Please analyze this document"
   - Click "Send"
   - Verify: File appears in chat with icon and size
   - Verify: AI processes the file content in its response

2. **Upload Different File Types**:
   - Test with:
     - DOCX document
     - CSV file
     - TXT file
     - PNG/JPG image (if OCR enabled)
   - Verify: Each file type is handled appropriately

### 4. Voice Input Test

1. **Voice Recording**:
   - Click "Voice" button
   - Speak a message (e.g., "What's the weather today?")
   - Verify: Recording indicator appears (red button)
   - Verify: Transcribed text appears in input and sends automatically

2. **Text-to-Speech**:
   - Wait for AI response
   - Click "Play" button next to AI message
   - Verify: Audio plays the message content

### 5. Email Draft Generation Test

1. **Trigger Email Draft**:
   - Send message: "I need to send an email about safety compliance"
   - Verify: AI response includes "Review Email Draft" button

2. **Review Draft**:
   - Click "Review Email Draft" button
   - Verify: Draft modal opens with:
     - Subject field
     - Recipients list
     - Email body
     - Edit/preview toggle
     - Confirmation checkbox

3. **Modify Draft**:
   - Click "Edit" to modify email body
   - Add custom recipients using the "Add" button
   - Check confirmation checkbox

4. **Send Email**:
   - Click "Send Email"
   - Verify: Success toast appears
   - Check server logs for email sending confirmation

### 6. Communication Logs Test

1. **Check Database**:
   ```bash
   cd server
   npx prisma studio
   ```
   - Open `CommunicationLog` table
   - Verify: All interactions are logged with proper types

2. **API Endpoints**:
   - Test `/api/communication/logs` - Should return chat logs
   - Test `/api/communication/stats` - Should return usage statistics

### 7. Error Handling Test

1. **Invalid File Type**:
   - Try to upload an unsupported file type (e.g., .exe)
   - Verify: Error message appears

2. **Large File**:
   - Try to upload a file > 10MB
   - Verify: Size limit error appears

3. **Network Issues**:
   - Disconnect internet temporarily
   - Send a message
   - Verify: Appropriate error handling

## Expected Results

### Success Criteria

- ✅ Chat interface loads without errors
- ✅ Text messages send and receive responses
- ✅ File uploads work for all supported types
- ✅ Voice input captures and transcribes speech
- ✅ Text-to-speech plays AI responses
- ✅ Email drafts are generated for relevant requests
- ✅ Draft modal allows editing and sending emails
- ✅ All interactions are logged in database
- ✅ Error handling works for edge cases

### Sample Test Data

**Test Files**:
- `sample.pdf` - Simple PDF with text content
- `sample.docx` - Word document with paragraphs
- `sample.csv` - CSV with 5-10 rows of data
- `sample.png` - Image with visible text (for OCR test)

**Test Messages**:
- "Hello, how can you help with facility management?"
- "I need to send an email to the safety team about compliance"
- "Please analyze this document" (with file attachment)
- "What are our HSSE protocols?" (voice input)

## Troubleshooting

### Common Issues

1. **File Upload Fails**:
   - Check file size limit (10MB)
   - Verify supported file types
   - Check server uploads directory permissions

2. **Voice Input Not Working**:
   - Ensure browser supports Web Speech API
   - Check microphone permissions
   - Try in Chrome/Edge for best compatibility

3. **Email Not Sending**:
   - Verify email configuration in `.env`
   - Check SMTP server settings
   - Look for errors in server console

4. **AI Responses Slow**:
   - Check OpenAI API key validity
   - Monitor API rate limits
   - Check network connectivity

### Debug Commands

```bash
# Check server logs
cd server && npm run dev

# Check client console
# Open browser developer tools

# Database inspection
cd server && npx prisma studio

# Test API endpoints directly
curl -X POST http://localhost:3001/api/chat-agent \
  -F "message=test message" \
  -F "file=@sample.pdf"
```

## Performance Metrics

- Response time for text messages: < 5 seconds
- File processing time: < 30 seconds (depending on size)
- Voice transcription: < 3 seconds
- Email draft generation: < 10 seconds

## Security Checks

- File type validation working
- File size limits enforced
- No sensitive data exposure in logs
- API endpoints properly secured (add auth middleware if needed)

---

**Next Steps**: After successful testing, integrate authentication middleware and deploy to production environment.
