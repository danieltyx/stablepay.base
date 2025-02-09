'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface OnrampButtonProps {
  address: string | null;
}

export default function OnrampButton({ address }: OnrampButtonProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const generateOnrampUrl = () => {
    if (!address || !amount) return null;

    const onrampUrl = new URL('https://pay.coinbase.com/buy/select-asset');
    onrampUrl.searchParams.set('appId', '2606a107-3b83-434f-b367-ac397c9a4457');
    onrampUrl.searchParams.set('addresses', JSON.stringify({
      [address]: ["base"]
    }));
    onrampUrl.searchParams.set('assets', JSON.stringify(["USDC"]));
    onrampUrl.searchParams.set('defaultAsset', 'USDC');
    onrampUrl.searchParams.set('defaultPaymentMethod', 'CARD');
    onrampUrl.searchParams.set('fiatCurrency', 'USD');
    onrampUrl.searchParams.set('presetFiatAmount', amount);
    onrampUrl.searchParams.set('defaultNetwork', 'base');

    return onrampUrl.toString();
  };

  const handleOnramp = async () => {
    if (!address || !amount) return;
    setLoading(true);
    try {
      const url = generateOnrampUrl();
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Onramp error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = () => {
    const url = generateOnrampUrl();
    if (url) {
      setQrUrl(url);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Amount (USD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setQrUrl(null);
          }}
          placeholder="Enter amount in USD"
          className="w-full p-2 rounded-md border border-border bg-background"
          min="1"
          step="1"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleOnramp}
          disabled={!address || loading || !amount}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : `Buy ${amount ? `$${amount}` : ''} USDC with Card`}
        </button>
        
        <button
          onClick={handleGenerateQR}
          disabled={!address || !amount}
          className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate QR Code"
        >
          QR Code
        </button>
      </div>

      {qrUrl && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex justify-center">
            <QRCodeSVG
              value={qrUrl}
              size={200}
              includeMargin
              level="H"
            />
          </div>
          <p className="text-sm text-center text-muted-foreground mt-2">
            Scan to buy USDC on mobile
          </p>
        </div>
      )}
    </div>
  );
} 