import { hash } from "starknet";
import { connect } from "get-starknet";

export async function connectWallet() {
  const starknet = await connect();
  if (!starknet) throw new Error("User rejected wallet connection");
  
  const sn = starknet as any;
  if (sn.enable) {
    await sn.enable();
  }
  return starknet;
}

export function hashBid(amount: string, salt: string) {
  // Simple poseidon hash for MVP
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
