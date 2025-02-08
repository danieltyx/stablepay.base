'use client';

import { useState, useEffect } from 'react';

// Import necessary libraries
import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  erc20ActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";

const WALLET_DATA_FILE = "wallet_data.txt";

export default function AIChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I can help you with payments, analytics, and NFT rewards. What would you like to do?'
    }]);
  }, []);

  // Function to initialize the agent
  async function initializeAgent() {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr = fs.existsSync(WALLET_DATA_FILE)
      ? fs.readFileSync(WALLET_DATA_FILE, "utf8")
      : null;

    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [walletActionProvider(), erc20ActionProvider()],
    });

    const tools = await getLangChainTools(agentkit);

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: `
        You are a helpful assistant specializing in blockchain interactions. Focus on providing clear, actionable advice.`,
    });

    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(await walletProvider.exportWallet()));

    return agent;
  }

  // Chat function that interacts with the initialized agent
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      // Initialize the agent and get response
      const agent = await initializeAgent();
      const response = await agent.invoke({ messages: [new HumanMessage(input)] });
      
      // Add assistant's response to messages
      setMessages([...newMessages, { role: 'assistant', content: String(response.messages[0].content) }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary/10 ml-auto' 
                : 'bg-muted'
            } max-w-[80%]`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 rounded-md border border-border bg-background"
            placeholder="Ask about payments, analytics, or NFT rewards..."
          />
          <button 
            type="submit"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
