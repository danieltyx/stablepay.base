'use client';

import { useState, useEffect } from 'react';
import { getTokenBalances, getRecentTransactions, formatAddress, getTransactionUrl } from '../lib/coinbase';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface WalletActivityProps {
  address: string | null;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  value: string;
}

interface Transaction {
  hash: string;
  timestamp: string;
  type: 'received' | 'sent';
  amount: string;
  from: string;
  to: string;
  token?: 'ETH' | 'USDC';
}

export default function WalletActivity({ address }: WalletActivityProps) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [newBalances, newTransactions] = await Promise.all([
        getTokenBalances(address),
        getRecentTransactions(address)
      ]);
      
      setBalances(newBalances);
      setTransactions(newTransactions);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data initially and set up refresh interval
  useEffect(() => {
    fetchData();

    // Refresh every minute
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [address]);

  if (!address) {
    return (
      <div className="text-center text-muted-foreground">
        Connect your wallet to view holdings and activity
      </div>
    );
  }

  // Add error display
  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Holdings */}
      <div className="p-6 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">USDC Balance</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {balances.map((token) => (
          token.symbol === 'USDC' && (
            <div key={token.symbol} className="flex justify-between items-center py-3">
              <div>
                <span className="font-medium">{token.symbol}</span>
                <p className="text-sm text-muted-foreground">
                  Balance: {token.balance}
                </p>
              </div>
              <div className="text-right">
                <span className="font-medium">{token.value}</span>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No recent transactions
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-3 rounded-lg bg-muted"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium ${
                    tx.type === 'received' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {tx.type === 'received' ? 'Received' : 'Sent'} {tx.amount}
                    {tx.token && ` (${tx.token})`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  From: {formatAddress(tx.from)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  To: {formatAddress(tx.to)}
                </div>
                <a
                  href={getTransactionUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  View on BaseScan →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 