import { Agent } from '@coinbase/agentkit';
import { NextResponse } from 'next/server';

const agent = new Agent({
  name: "StablePay Assistant",
  description: "AI assistant that helps manage crypto payments and analytics",
  instructions: `You are a helpful payment assistant that can:
    - Generate payment QR codes
    - Analyze transaction history
    - Provide insights on customer behavior
    - Help with NFT reward management`,
  functions: {
    generatePaymentQR: {
      description: "Generate a QR code for USDC payment",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Amount in USDC"
          },
          discount: {
            type: "number",
            description: "Discount percentage (optional)"
          }
        },
        required: ["amount"]
      }
    },
    getAnalytics: {
      description: "Get payment analytics",
      parameters: {
        type: "object",
        properties: {
          timeframe: {
            type: "string",
            enum: ["day", "week", "month"]
          }
        },
        required: ["timeframe"]
      }
    }
  }
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    const response = await agent.chat(messages);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 