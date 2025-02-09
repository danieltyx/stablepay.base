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
  private address: string;

  constructor() {
    this.address = ''; // Initialize empty
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I can help you with payments, analytics, and rewards. What would you like to do?'
    });
  }

  // Add method to set address
  setAddress(address: string) {
    this.address = address;
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
      case 'onrampUSDC':
        return await this.onrampUSDC(args.amount);
      case 'deploySmartContract':
        return await this.deploySmartContract(args.contractType);
      case 'createMPCWallet':
        return await this.createMPCWallet();
      case 'automatePayments':
        return await this.automatePayments(args.schedule, args.amount);
      case 'createLoyaltyProgram':
        return await this.createLoyaltyProgram();
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

  async onrampUSDC(amount: number) {
    try {
      const session = await createOnrampSession(amount, this.address);
      return {
        onrampUrl: session.redirectUrl,
        amount,
        currency: 'USDC',
        sessionId: session.id
      };
    } catch (error) {
      console.error('Onramp error:', error);
      throw error;
    }
  }

  async deploySmartContract(contractType: 'loyalty' | 'rewards' | 'custom') {
    try {
      const contract = await deployContract(contractType, {
        name: `${contractType.toUpperCase()} Contract`,
        symbol: contractType === 'loyalty' ? 'LOYAL' : 'RWRD',
      });
      return {
        contractAddress: contract.address,
        type: contractType,
        network: 'base',
        txHash: contract.deploymentTx
      };
    } catch (error) {
      console.error('Contract deployment error:', error);
      throw error;
    }
  }

  async createMPCWallet() {
    try {
      const wallet = await createWallet(Date.now().toString());
      return {
        walletAddress: wallet.address,
        type: 'mpc',
        capabilities: ['transactions', 'automation'],
        walletId: wallet.id
      };
    } catch (error) {
      console.error('MPC wallet creation error:', error);
      throw error;
    }
  }

  async automatePayments(schedule: 'daily' | 'weekly' | 'monthly', amount: number) {
    try {
      const wallet = await this.createMPCWallet();
      const payment = await schedulePayment(
        wallet.walletId,
        schedule,
        amount,
        this.address
      );
      return {
        schedule,
        amount,
        status: 'scheduled',
        paymentId: payment.id,
        nextPayment: payment.nextExecutionTime
      };
    } catch (error) {
      console.error('Payment automation error:', error);
      throw error;
    }
  }

  async createLoyaltyProgram() {
    try {
      const program = await setupLoyaltyProgram({
        spendMultiplier: 0.05,
        minimumSpend: 100
      });
      return {
        programId: program.programId,
        rewardRules: program.rewardRules,
        status: 'active'
      };
    } catch (error) {
      console.error('Loyalty program creation error:', error);
      throw error;
    }
  }
} 