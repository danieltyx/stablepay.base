import { getTokenBalances, getRecentTransactions } from './coinbase';

interface Stats {
  totalRevenue: string;
  customers: number;
  savings: string;
}

export async function getStats(address: string | null): Promise<Stats> {
  if (!address) {
    return {
      totalRevenue: '$0.00',
      customers: 0,
      savings: '$0.00'
    };
  }

  try {
    // Get balances and transactions
    const [balances, transactions] = await Promise.all([
      getTokenBalances(address),
      getRecentTransactions(address)
    ]);

    // Get USDC balance for total revenue
    const usdcBalance = balances.find(b => b.symbol === 'USDC');
    const totalRevenue = usdcBalance ? usdcBalance.value : '$0.00';

    // Calculate savings (5% of USDC balance)
    const usdcAmount = parseFloat(usdcBalance?.balance || '0');
    const savings = `$${(usdcAmount * 0.05).toFixed(2)}`;

    // Calculate unique customers from received USDC transactions
    const usdcTransactions = transactions.filter(
      tx => tx.token === 'USDC' && tx.type === 'received'
    );

    const uniqueCustomers = new Set(
      usdcTransactions.map(tx => tx.from.toLowerCase())
    );

    return {
      totalRevenue,
      customers: uniqueCustomers.size,
      savings
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalRevenue: '$0.00',
      customers: 0,
      savings: '$0.00'
    };
  }
} 