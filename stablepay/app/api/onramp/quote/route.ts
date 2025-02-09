import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, asset, address } = await req.json();

    // For demo purposes, return a mock quote ID
    // In production, you would integrate with Coinbase's API
    return NextResponse.json({ 
      quoteId: `MOCK_QUOTE_${Date.now()}`
    });
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    );
  }
} 