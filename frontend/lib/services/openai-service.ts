export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Service for interacting with OpenAI API
 */
export class OpenAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
  }

  /**
   * Get the OpenAI API key from environment variables
   * @returns The OpenAI API key
   */
  private getApiKey(): string {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('openai_api_key');
      if (storedKey) return storedKey;
    }
    
    return this.apiKey;
  }

  /**
   * Set a custom OpenAI API key
   * @param apiKey The OpenAI API key to use
   */
  public setApiKey(apiKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openai_api_key', apiKey);
    }
    this.apiKey = apiKey;
  }

  /**
   * Set the OpenAI model to use
   * @param model The OpenAI model to use
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Generate a chat response using OpenAI API
   * @param messages The conversation history
   * @returns Promise with the generated response
   */
  async generateChatResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        throw new Error('OpenAI API key is not set');
      }

      if (!messages.some(msg => msg.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: 'You are TracklyAI, a helpful assistant for the TrackLy attendance tracking application. You help students with their attendance, academic schedules, and provide useful advice related to their studies. Be concise, friendly, and helpful.'
        });
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate response');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate a fallback response when OpenAI API is not available
   * @param input The user's input
   * @returns A fallback response
   */
  generateFallbackResponse(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('attendance') && lowerInput.includes('percentage')) {
      return "Your current overall attendance is 87.5%. You've been doing great this semester!";
    } 
    else if (lowerInput.includes('missed') || lowerInput.includes('absent')) {
      return "You've missed 5 classes this semester. Your attendance is still above the required threshold of 75%.";
    } 
    else if (lowerInput.includes('today') && lowerInput.includes('class')) {
      return "You have 4 classes today: Data Structures (9:00 AM), Computer Networks (11:00 AM), Database Systems (2:00 PM), and Technical Writing (4:00 PM).";
    } 
    else if (lowerInput.includes('improve') || lowerInput.includes('better')) {
      return "To improve your attendance, try setting up morning alarms, preparing your materials the night before, and using the notification system in the app to get reminders.";
    } 
    else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return "Hello! How can I help you with your attendance tracking today?";
    }
    else if (lowerInput.includes('help')) {
      return "I'm here to help! You can ask me about your attendance records, class schedules, or suggestions to improve your attendance rate.";
    }
    else if (lowerInput.includes('thank')) {
      return "You're welcome! Feel free to ask if you need any more assistance with your attendance tracking.";
    }
    else {
      return "I'm here to help with your attendance tracking. You can ask me about your attendance percentage, missed classes, today's schedule, or how to improve your attendance.";
    }
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
