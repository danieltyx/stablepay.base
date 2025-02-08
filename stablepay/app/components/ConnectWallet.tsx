'use client';

import { useState, useEffect } from 'react';

interface ConnectWalletProps {
  onAddressChange: (address: string | null) => void;
}

export default function ConnectWallet({ onAddressChange }: ConnectWalletProps) {
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Update the address state and notify parent
  const updateAddress = (newAddress: string | null) => {
    setAddress(newAddress || '');
    onAddressChange(newAddress);
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Switch to Base network or add if not present
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Chain ID for Base: 8453 (0x2105)
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base Mainnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org']
            }]
          });
        } else {
          throw switchError;
        }
      }

      updateAddress(accounts[0]);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
      updateAddress(null);
    }
  };

  // Handle account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          updateAddress(accounts[0]);
        } else {
          updateAddress(null);
        }
      });
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [onAddressChange]);

  return (
    <button
      onClick={connectWallet}
      className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
} 