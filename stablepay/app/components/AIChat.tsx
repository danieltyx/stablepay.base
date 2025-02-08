'use client';

import { useState, useEffect } from 'react';
import { PaymentAgent } from '../lib/ai/agent';

export default function AIChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [agent] = useState(() => new PaymentAgent());

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I can help you with payments, analytics, and NFT rewards. What would you like to do?'
    }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      // Get AI response
      const response = await agent.chat(input);
      setMessages([...newMessages, response]);
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