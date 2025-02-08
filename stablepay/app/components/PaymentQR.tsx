'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentQRProps {
  connectedAddress: string | null;
}

export default function PaymentQR({ connectedAddress }: PaymentQRProps) {
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('5'); // Default 5% discount

  // Generate ERC-681 compatible payment URL for USDC transfer
  const getPaymentURL = () => {
    const finalAmount = parseFloat(amount);
    const discountPercent = discount ? parseFloat(discount) : 0;
    const discountedAmount = finalAmount * (1 - discountPercent / 100);
    
    // Convert amount to USDC decimals (6 decimals)
    const amountInDecimals = (discountedAmount * 1000000).toString();

    // USDC contract on Base
    const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    
    // Create ERC-681 format URL
    // ethereum:<token-address>/transfer?address=<recipient>&uint256=<amount>&chainId=8453
    const paymentUrl = `ethereum:${usdcAddress}/transfer?address=${connectedAddress}&uint256=${amountInDecimals}&chainId=8453`;

    return paymentUrl;
  };

  // Format amount for display
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Calculate discounted amount
  const getDiscountedAmount = () => {
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) return '0.00';
    const discountPercent = discount ? parseFloat(discount) : 0;
    return (finalAmount * (1 - discountPercent / 100)).toFixed(2);
  };

  return (
    <div className="p-6 rounded-lg border border-border">
      <h2 className="text-lg font-semibold mb-4">Scan to Pay</h2>
      {!connectedAddress ? (
        <div className="text-center text-muted-foreground">
          Connect your wallet to receive payments
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-2 rounded-md border border-border bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Enter discount percentage"
              className="w-full p-2 rounded-md border border-border bg-background"
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Price:</span>
                <span>${formatAmount(amount)} USDC</span>
              </div>
              <div className="flex justify-between text-sm text-green-500">
                <span>Discount ({discount}%):</span>
                <span>-${(parseFloat(amount) - parseFloat(getDiscountedAmount())).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-border">
                <span>Final Price:</span>
                <span>${getDiscountedAmount()} USDC</span>
              </div>
            </div>
          )}

          {amount && parseFloat(amount) > 0 && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <QRCodeSVG
                value={getPaymentURL()}
                size={200}
                includeMargin
                level="H"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 