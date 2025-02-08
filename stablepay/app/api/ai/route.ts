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
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const WALLET_DATA_FILE = "wallet_data.txt";

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

export async function chatWithAgent(input: string) {
  const agent = await initializeAgent();
  const response = await agent.invoke({ messages: [new HumanMessage(input)] });
  return response.messages[0].content;
}
