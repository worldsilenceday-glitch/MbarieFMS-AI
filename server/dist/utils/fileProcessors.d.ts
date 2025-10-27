export interface FileExtractionResult {
    text: string;
    summary: string;
    metadata?: {
        pageCount?: number;
        wordCount?: number;
        dimensions?: {
            width: number;
            height: number;
        };
    };
}
/**
 * Extract text from various file types
 */
export declare function extractTextFromFile(filePath: string, mimeType: string): Promise<FileExtractionResult>;
/**
 * Generate a short summary using OpenAI
 */
export declare function generateSummary(text: string): Promise<string>;
/**
 * Validate file type and size
 */
export declare function validateFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
};
/**
 * Clean up temporary files
 */
export declare function cleanupFile(filePath: string): void;
//# sourceMappingURL=fileProcessors.d.ts.map