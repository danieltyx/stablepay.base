// Remove direct AgentKit import since we'll use a different approach
export type Message = {
  role: 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
};

export class PaymentAgent {
  private messages: Message[] = [];

  constructor() {
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I can help you with payments, analytics, and rewards. What would you like to do?'
    });
  }

  async chat(userInput: string): Promise<Message> {
    try {
      // Add user message to history
      const userMessage: Message = {
        role: 'user',
        content: userInput
      };
      this.messages.push(userMessage);

      // Call the AI API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.json();
      
      // Handle function calls if present
      if (aiResponse.function_call) {
        const functionResult = await this.handleFunctionCall(aiResponse.function_call);
        this.messages.push({
          role: 'function',
          name: aiResponse.function_call.name,
          content: JSON.stringify(functionResult)
        });
        
        // Get final response after function call
        const finalResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: this.messages,
          }),
        });
        
        const finalAiResponse = await finalResponse.json();
        this.messages.push(finalAiResponse);
        return finalAiResponse;
      }

      this.messages.push(aiResponse);
      return aiResponse;
    } catch (error) {
      console.error('Chat error:', error);
      return {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
    }
  }

  private async handleFunctionCall(functionCall: { name: string; arguments: string }) {
    const args = JSON.parse(functionCall.arguments);
    
    switch (functionCall.name) {
      case 'generatePaymentQR':
        return await this.generatePaymentQR(args.amount, args.discount);
      case 'getAnalytics':
        return await this.getAnalytics(args.timeframe);
      default:
        throw new Error(`Unknown function: ${functionCall.name}`);
    }
  }

  async generatePaymentQR(amount: number, discount: number = 0) {
    // TODO: Implement actual QR code generation with USDC payment data
    return {
      qrCode: `usdc:payment?amount=${amount}&discount=${discount}`,
      amount,
      discount
    };
  }

  async getAnalytics(timeframe: 'day' | 'week' | 'month') {
    // TODO: Implement actual analytics fetching
    return {
      totalTransactions: 0,
      volume: 0,
      uniqueCustomers: 0
    };
  }
} 