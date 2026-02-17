import { Contract, Provider, Account, ec, hash, CallData } from "starknet";
import { connect, disconnect } from "get-starknet";

export async function connectWallet() {
  const starknet = await connect();
  if (!starknet) throw new Error("User rejected wallet connection");
  await starknet.enable();
  return starknet;
}

export function hashBid(amount: string, salt: string) {
  // Simple poseidon hash for MVP
  // In a real app, this should match the Cairo implementation exactly
  return hash.computePoseidonHash(amount, salt);
}

export const AUCTION_ABI = [
  {
    "name": "IAuction",
    "type": "interface",
    "items": [
      {
        "name": "create_auction",
        "type": "function",
        "inputs": [
          { "name": "bidding_end", "type": "core::integer::u64" },
          { "name": "reveal_end", "type": "core::integer::u64" }
        ],
        "outputs": [{ "type": "core::integer::u64" }],
        "state_mutability": "external"
      },
      {
        "name": "commit_bid",
        "type": "function",
        "inputs": [
          { "name": "auction_id", "type": "core::integer::u64" },
          { "name": "bid_hash", "type": "core::felt252" }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "reveal_bid",
        "type": "function",
        "inputs": [
          { "name": "auction_id", "type": "core::integer::u64" },
          { "name": "amount", "type": "core::integer::u128" },
          { "name": "salt", "type": "core::felt252" }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  }
];
