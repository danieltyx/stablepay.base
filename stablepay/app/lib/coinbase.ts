import { createPublicClient, http, formatEther, formatUnits, parseAbiItem, decodeEventLog } from 'viem';
import { base } from 'viem/chains';

// Create a public client for Base chain
const client = createPublicClient({
  chain: base,
  transport: http(),
});

// Contract addresses
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const CHAINLINK_ETH_USD_FEED = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';

// ABIs
const USDC_ABI = [
  // Balance
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Transfer event
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;

const PRICE_FEED_ABI = [{
  "inputs": [],
  "name": "latestRoundData",
  "outputs": [
    {"name": "roundId", "type": "uint80"},
    {"name": "answer", "type": "int256"},
    {"name": "startedAt", "type": "uint256"},
    {"name": "updatedAt", "type": "uint256"},
    {"name": "answeredInRound", "type": "uint80"}
  ],
  "stateMutability": "view",
  "type": "function"
}] as const;

// Get ETH price from Chainlink
async function getEthPrice() {
  try {
    const [, answer] = await client.readContract({
      address: CHAINLINK_ETH_USD_FEED,
      abi: PRICE_FEED_ABI,
      functionName: 'latestRoundData',
    });
    return Number(answer) / 1e8; // Chainlink prices have 8 decimals
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
}

export async function getTokenBalances(address: string) {
  try {
    // Get USDC balance only
    const usdcBalance = await client.readContract({
      address: USDC_CONTRACT,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    const usdcBalanceFormatted = formatUnits(usdcBalance, 6);

    return [
      {
        symbol: 'USDC',
        balance: usdcBalanceFormatted,
        value: `$${usdcBalanceFormatted}`, // USDC is pegged to USD
      },
    ];
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}

// At the top of the file with other interfaces
type TransactionType = 'received' | 'sent';

interface Transaction {
  hash: string;
  timestamp: string;
  type: TransactionType;
  amount: string;
  from: string;
  to: string;
  token?: 'ETH' | 'USDC';
}

export async function getRecentTransactions(address: string): Promise<Transaction[]> {
  try {
    const blockNumber = await client.getBlockNumber();
    const fromBlock = blockNumber - BigInt(10000);

    // Cast address to the correct format
    const formattedAddress = address as `0x${string}`;

    const [blocks, usdcLogs] = await Promise.all([
      // Get recent blocks with transactions
      Promise.all(
        Array.from({ length: 20 }, (_, i) => 
          client.getBlock({
            blockNumber: blockNumber - BigInt(i),
            includeTransactions: true,
          })
        )
      ),

      // USDC logs (keep this part the same)
      client.getLogs({
        address: USDC_CONTRACT,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        fromBlock,
        toBlock: blockNumber,
        args: {
          from: formattedAddress,
          to: formattedAddress,
        },
      })
    ]);

    // Format ETH transactions
    const formattedEthTxs = blocks
      .flatMap(block => 
        block.transactions.map(tx => ({ ...tx, blockTimestamp: block.timestamp }))
      )
      .filter(tx => 
        typeof tx !== 'string' && 
        (tx.from.toLowerCase() === address.toLowerCase() || 
         tx.to?.toLowerCase() === address.toLowerCase())
      )
      .map(tx => ({
        hash: tx.hash,
        timestamp: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
        type: (tx.to?.toLowerCase() === address.toLowerCase() ? 'received' : 'sent') as TransactionType,
        amount: `${formatEther(tx.value)} ETH`,
        from: tx.from,
        to: tx.to || '',
        token: 'ETH' as const
      }));

    // Format USDC transactions
    const formattedUsdcTxs = await Promise.all(
      usdcLogs.map(async (log) => {
        const block = await client.getBlock({ blockNumber: log.blockNumber });
        const { args: { from, to, value } } = decodeEventLog({
          abi: USDC_ABI,
          data: log.data,
          topics: log.topics,
        }) as { args: { from: string; to: string; value: bigint } };

        return {
          hash: log.transactionHash,
          timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          type: to.toLowerCase() === address.toLowerCase() ? 'received' : 'sent' as TransactionType,
          amount: `${formatUnits(value, 6)} USDC`,
          from,
          to,
          token: 'USDC' as const
        };
      })
    );

    // Combine and sort all transactions by timestamp (most recent first)
    const allTxs = [...formattedEthTxs, ...formattedUsdcTxs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return the 10 most recent transactions
    return allTxs.slice(0, 10);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Function to format addresses for display
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Function to get transaction URL
export function getTransactionUrl(hash: string): string {
  return `https://basescan.org/tx/${hash}`;
} 