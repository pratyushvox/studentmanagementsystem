import axios from 'axios';

export class AIService {
  static async analyzeContent(content: string): Promise<string> {
    try {
      const prompt = this.getAnalysisPrompt(content);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-r1:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.YOUR_SITE_URL,
            'X-Title': process.env.YOUR_SITE_NAME,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('AI Service Error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.data?.error?.code === 429) {
        throw new Error('AI service is temporarily rate limited. Please try again in a few moments.');
      } else if (error.response?.data?.error?.message?.includes('rate-limited')) {
        throw new Error('AI service is currently busy. Please wait a moment and try again.');
      } else if (error.response?.data?.error?.metadata?.raw?.includes('rate-limited')) {
        throw new Error('AI service is temporarily unavailable due to high demand. Please try again shortly.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI service request timed out. Please try again.');
      } else {
        throw new Error(`AI analysis failed: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }

  private static getAnalysisPrompt(content: string): string {
    const truncatedContent = content.length > 3500 
      ? content.substring(0, 3500) + '... [content truncated]' 
      : content;

    return `
    Analyze this student assignment and provide ONLY these 4 assessments:

    ASSIGNMENT CONTENT:
    ${truncatedContent}

    Provide your analysis in this exact format:
    
    AI Detection Score: [0-100%]
    Confidence Level: [Low/Medium/High]
    Originality Assessment: [Low/Medium/High] 
    Writing Quality Evaluation: [Poor/Fair/Good/Excellent]

    Do not add any other explanations, comments, or sections.
    `;
  }
}