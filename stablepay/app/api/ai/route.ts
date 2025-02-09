// /app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'fs';
import path from 'path';

// Store agent instance globally
let agentInstance: any = null;
let agentConfig: any = null;

// Define wallet data file path
const WALLET_DATA_FILE = path.join(process.cwd(), 'wallet_data.json');

// Function to read wallet data
function readWalletData() {
  try {
    if (fs.existsSync(WALLET_DATA_FILE)) {
      const data = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading wallet data:', error);
  }
  return null;
}

// Function to save wallet data
function saveWalletData(data: any) {
  try {
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving wallet data:', error);
  }
}

// Validate environment variables
function validateEnv() {
  const required = ['CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialize the agent
async function initializeAgent() {
  try {
    // Return existing instance if available
    if (agentInstance) {
      return { agent: agentInstance, config: agentConfig };
    }

    // Validate environment variables
    validateEnv();

    // Initialize OpenAI
    const llm = new ChatOpenAI({
      model: "gpt-3.5-turbo",
    });

    // Read existing wallet data
    const existingWalletData = readWalletData();

    // Configure CDP Wallet Provider
    const cdpConfig = {
      apiKeyName: process.env.CDP_API_KEY_NAME!,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      networkId: process.env.NETWORK_ID || "base-sepolia",
      cdpWalletData: existingWalletData
    };

    // Initialize wallet provider
    const walletProvider = await CdpWalletProvider.configureWithWallet(cdpConfig);

    // Save the new wallet data
    const exportedWallet = await walletProvider.exportWallet();
    saveWalletData(exportedWallet);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME!,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME!,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();

    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
        faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
        funds from the user. Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
        docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested. Your primary goal is to help 
        small business owners with accepting payments, checking balances, and other interactions.
      `,
    });

    agentInstance = agent;
    agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    return { agent, config: agentConfig };
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { agent, config } = await initializeAgent();

    let fullResponse = '';
    const stream = await agent.stream(
      { messages: [new HumanMessage(message)] },
      config
    );

    for await (const chunk of stream) {
      if ("agent" in chunk) {
        fullResponse += chunk.agent.messages[0].content;
      } else if ("tools" in chunk) {
        fullResponse += chunk.tools.messages[0].content;
      }
    }

    return NextResponse.json({ response: fullResponse });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}