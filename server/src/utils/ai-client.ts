import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

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
  provider?: string;
}

export class AIClient {
  private deepseekApiKey: string;
  private openaiApiKey: string;
  private deepseekBaseURL: string = 'https://api.deepseek.com/v1';
  private openaiBaseURL: string = 'https://api.openai.com/v1';

  constructor() {
    this.deepseekApiKey = process.env.AI_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateResponse(prompt: AIPrompt): Promise<AIResponse> {
    // Try DeepSeek first
    try {
      return await this.callDeepSeekAPI(prompt);
    } catch (deepseekError) {
      console.warn('DeepSeek API failed, trying OpenAI fallback:', deepseekError);
      
      // Try OpenAI fallback
      try {
        return await this.callOpenAIAPI(prompt);
      } catch (openaiError) {
        console.error('Both DeepSeek and OpenAI APIs failed:', openaiError);
        throw new Error('Failed to generate AI response from all providers');
      }
    }
  }

  private async callDeepSeekAPI(prompt: AIPrompt): Promise<AIResponse> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await axios.post(
      `${this.deepseekBaseURL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.deepseekApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    return {
      content: content,
      usage: response.data.usage ? {
        prompt_tokens: response.data.usage.prompt_tokens,
        completion_tokens: response.data.usage.completion_tokens,
        total_tokens: response.data.usage.total_tokens
      } : undefined,
      provider: 'deepseek'
    };
  }

  private async callOpenAIAPI(prompt: AIPrompt): Promise<AIResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(
      `${this.openaiBaseURL}/chat/completions`,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    return {
      content: content,
      usage: response.data.usage ? {
        prompt_tokens: response.data.usage.prompt_tokens,
        completion_tokens: response.data.usage.completion_tokens,
        total_tokens: response.data.usage.total_tokens
      } : undefined,
      provider: 'openai'
    };
  }

  async analyzeData(data: any, analysisType: string): Promise<string> {
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

export default new AIClient();
