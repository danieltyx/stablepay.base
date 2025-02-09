'use client';

import Image from "next/image";
import AIChat from './components/AIChat';
import ConnectWallet from './components/ConnectWallet';
import PaymentQR from './components/PaymentQR';
import WalletActivity from './components/WalletActivity';
import Analytics from './components/Analytics';
import OnrampButton from './components/OnrampButton';
import { useState, useEffect } from 'react';
import { getStats } from './lib/stats';

interface Stats {
  totalRevenue: string;
  customers: number;
  savings: string;
}

export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: '$0.00',
    customers: 0,
    savings: '$0.00'
  });
  const [loading, setLoading] = useState(false);

  // Fetch stats when address changes or periodically
  useEffect(() => {
    const fetchStats = async () => {
      if (!connectedAddress) return;
      
      setLoading(true);
      try {
        const newStats = await getStats(connectedAddress);
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);

    return () => clearInterval(interval);
  }, [connectedAddress]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="StablePay AI"
              width={32}
              height={32}
              priority
            />
            <span className="font-semibold">StablePay AI</span>
          </div>
          <ConnectWallet onAddressChange={setConnectedAddress} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-lg bg-muted relative">
              {loading && (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </h3>
              <p className="text-2xl font-semibold mt-2">{stats.totalRevenue} USDC</p>
            </div>
            <div className="p-6 rounded-lg bg-muted relative">
              {loading && (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                Customers
              </h3>
              <p className="text-2xl font-semibold mt-2">{stats.customers}</p>
            </div>
            <div className="p-6 rounded-lg bg-muted relative">
              {loading && (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                Dollar Savings
              </h3>
              <p className="text-2xl font-semibold mt-2">{stats.savings}</p>
            </div>
          </div>

          {/* Onramp Section */}
          <div className="p-6 rounded-lg bg-muted">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-lg font-semibold mb-2">Get Started with USDC</h2>
              <p className="text-muted-foreground mb-4">
                Buy USDC instantly with your credit card to start accepting payments
              </p>
              <OnrampButton address={connectedAddress} />
            </div>
          </div>

          {/* Payment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PaymentQR connectedAddress={connectedAddress} />
            
            <div className="p-6 rounded-lg border border-border">
              <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
              <div className="h-[300px]">
                <AIChat />
              </div>
            </div>
          </div>

          {/* Wallet Activity Section */}
          <WalletActivity address={connectedAddress} />

          {/* Analytics Section */}
          <Analytics />
        </div>
      </main>
    </div>
  );
}
