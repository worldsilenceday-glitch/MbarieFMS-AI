"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AIClient {
    constructor() {
        this.apiKey = process.env.AI_API_KEY || '';
        this.baseURL = 'https://api.deepseek.com/v1';
    }
    async generateResponse(prompt) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: prompt.system },
                    { role: "user", content: prompt.user }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0]?.message?.content || '';
            return {
                content: content,
                usage: response.data.usage ? {
                    prompt_tokens: response.data.usage.prompt_tokens,
                    completion_tokens: response.data.usage.completion_tokens,
                    total_tokens: response.data.usage.total_tokens
                } : undefined
            };
        }
        catch (error) {
            console.error('Error calling DeepSeek API:', error);
            throw new Error('Failed to generate AI response');
        }
    }
    async analyzeData(data, analysisType) {
        const systemPrompt = `You are an expert facility management and HSSE (Health, Safety, Security & Environment) analyst for Mbarie Services Ltd. Your role is to analyze facility data and provide insights, recommendations, and alerts based on the data provided.`;
        const userPrompt = `
Analysis Type: ${analysisType}

Data to Analyze:
${JSON.stringify(data, null, 2)}

Please provide:
1. Key insights and observations
2. Any anomalies or concerning patterns
3. Recommendations for improvement
4. Safety considerations
5. Any alerts that should be raised

Format your response in a clear, professional manner suitable for management reporting.
`;
        const response = await this.generateResponse({
            system: systemPrompt,
            user: userPrompt
        });
        return response.content;
    }
}
exports.AIClient = AIClient;
exports.default = new AIClient();
//# sourceMappingURL=ai-client.js.map