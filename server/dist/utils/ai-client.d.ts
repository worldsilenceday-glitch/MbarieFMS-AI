export interface AIPrompt {
    system: string;
    user: string;
}
export interface AIResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare class AIClient {
    private apiKey;
    private baseURL;
    constructor();
    generateResponse(prompt: AIPrompt): Promise<AIResponse>;
    analyzeData(data: any, analysisType: string): Promise<string>;
}
declare const _default: AIClient;
export default _default;
//# sourceMappingURL=ai-client.d.ts.map