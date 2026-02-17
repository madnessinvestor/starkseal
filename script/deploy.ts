import { Account, RpcProvider, json } from "starknet";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.VITE_STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io";
  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const accountAddress = process.env.DEPLOYER_ADDRESS;

  if (!privateKey || !accountAddress) {
    console.error("Please set DEPLOYER_PRIVATE_KEY and DEPLOYER_ADDRESS in .env");
    process.exit(1);
  }

  const account = new Account(provider, accountAddress, privateKey);

  console.log("Deploying Voting contract to Starknet Sepolia...");

  // Load compiled contract
  const sierraFile = path.join(__dirname, "../contracts/target/dev/starkseal_PrivateVoting.contract_class.json");
  const casmFile = path.join(__dirname, "../contracts/target/dev/starkseal_PrivateVoting.compiled_contract_class.json");

  if (!fs.existsSync(sierraFile) || !fs.existsSync(casmFile)) {
    console.error("Contract not built. Run 'cd contracts && scarb build' first.");
    process.exit(1);
  }

  const sierra = json.parse(fs.readFileSync(sierraFile).toString("ascii"));
  const casm = json.parse(fs.readFileSync(casmFile).toString("ascii"));

  const deployResponse = await account.declareAndDeploy({
    contract: sierra,
    casm: casm,
  });

  console.log("Contract deployed successfully!");
  console.log("Contract Address:", deployResponse.deploy.contract_address);
  console.log("Transaction Hash:", deployResponse.deploy.transaction_hash);
  
  console.log("\nUpdate your .env file with:");
  console.log(`VITE_VOTING_CONTRACT_ADDRESS=${deployResponse.deploy.contract_address}`);
}

main().catch(console.error);
