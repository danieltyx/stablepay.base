interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
}

interface FraudAlert {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  timestamp: string;
  transactionHash?: string;
}

export async function getAnalyticsInsights(): Promise<AnalyticsInsight[]> {
  // Sample insights data
  return [
    {
      type: 'success',
      title: 'Peak Transaction Time',
      description: 'Most transactions occur between 2 PM - 4 PM UTC',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      type: 'info',
      title: 'Customer Retention',
      description: '75% of customers made repeat transactions this week',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      type: 'warning',
      title: 'High Value Transfers',
      description: 'Unusual spike in transactions over $1,000 USDC',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  ];
}

export async function getFraudAlerts(): Promise<FraudAlert[]> {
  // Sample fraud alerts
  return [
    {
      severity: 'low',
      type: 'Multiple Small Transactions',
      description: 'Multiple small transactions from same address within 5 minutes',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      transactionHash: '0x1234...5678',
    },
    {
      severity: 'medium',
      type: 'Unusual Pattern',
      description: 'Irregular transaction pattern detected from address 0xabc...def',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      transactionHash: '0x8765...4321',
    },
    {
      severity: 'high',
      type: 'Potential Fraud',
      description: 'Suspicious activity detected: rapid transfers between multiple addresses',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      transactionHash: '0xfedc...ba98',
    },
  ];
} 