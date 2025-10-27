"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFile = extractTextFromFile;
exports.generateSummary = generateSummary;
exports.validateFile = validateFile;
exports.cleanupFile = cleanupFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const sync_1 = require("csv-parse/sync");
const tesseract_js_1 = require("tesseract.js");
const ai_client_1 = __importDefault(require("./ai-client"));
/**
 * Extract text from various file types
 */
async function extractTextFromFile(filePath, mimeType) {
    const fileExtension = path_1.default.extname(filePath).toLowerCase();
    try {
        let text = '';
        let metadata = {};
        switch (fileExtension) {
            case '.pdf':
                // TODO: Fix PDF parsing - temporarily disabled
                text = 'PDF processing temporarily disabled. Please use other file formats.';
                metadata = {
                    wordCount: 0
                };
                break;
            case '.docx':
                const docxResult = await mammoth_1.default.extractRawText({ path: filePath });
                text = docxResult.value;
                metadata = {
                    wordCount: text.split(/\s+/).length
                };
                break;
            case '.txt':
            case '.md':
            case '.json':
                text = fs_1.default.readFileSync(filePath, 'utf-8');
                metadata = {
                    wordCount: text.split(/\s+/).length
                };
                break;
            case '.csv':
                const csvData = fs_1.default.readFileSync(filePath, 'utf-8');
                const records = (0, sync_1.parse)(csvData, {
                    columns: true,
                    skip_empty_lines: true
                });
                const limited = records.slice(0, 200);
                text = `CSV Data (${limited.length} rows of ${records.length} total):\n\n`;
                if (limited.length > 0) {
                    text += `Headers: ${Object.keys(limited[0]).join(', ')}\n\n`;
                    text += 'Sample rows:\n';
                    limited.slice(0, 5).forEach((row, index) => {
                        text += `Row ${index + 1}: ${Object.values(row).join(' | ')}\n`;
                    });
                    if (limited.length > 5) {
                        text += `\n... and ${limited.length - 5} more rows`;
                    }
                }
                metadata = {
                    rowCount: limited.length,
                    columnCount: limited.length > 0 ? Object.keys(limited[0]).length : 0
                };
                break;
            case '.png':
            case '.jpg':
            case '.jpeg':
                if (process.env.ENABLE_IMAGE_OCR === 'true') {
                    const worker = await (0, tesseract_js_1.createWorker)('eng');
                    const { data: { text: ocrText } } = await worker.recognize(filePath);
                    await worker.terminate();
                    text = ocrText || 'No text detected in image';
                }
                else {
                    text = 'Image file - OCR processing disabled';
                }
                break;
            default:
                text = `Unsupported file type: ${fileExtension}. Content extraction not available.`;
        }
        // Generate summary using OpenAI
        const summary = await generateSummary(text);
        return {
            text: text.substring(0, 10000), // Limit text length
            summary,
            metadata
        };
    }
    catch (error) {
        console.error(`Error extracting text from file ${filePath}:`, error);
        throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate a short summary using OpenAI
 */
async function generateSummary(text) {
    if (!text || text.length < 50) {
        return 'No significant content to summarize';
    }
    try {
        const systemPrompt = `You are a helpful assistant that creates concise summaries. Create a brief 1-3 bullet point summary of the provided content. Focus on key points, main topics, and important information. Keep it very concise.`;
        const userPrompt = `Please summarize this content in 1-3 bullet points:\n\n${text.substring(0, 3000)}`;
        const response = await ai_client_1.default.generateResponse({
            system: systemPrompt,
            user: userPrompt
        });
        return response.content || 'Summary not available';
    }
    catch (error) {
        console.error('Error generating summary:', error);
        return 'Summary generation failed';
    }
}
/**
 * Validate file type and size
 */
function validateFile(file) {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.md', '.json', '.png', '.jpg', '.jpeg'];
    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        return {
            valid: false,
            error: `File type ${fileExtension} not allowed. Allowed types: ${allowedExtensions.join(', ')}`
        };
    }
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`
        };
    }
    return { valid: true };
}
/**
 * Clean up temporary files
 */
function cleanupFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`Cleaned up temporary file: ${filePath}`);
        }
    }
    catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
    }
}
//# sourceMappingURL=fileProcessors.js.map