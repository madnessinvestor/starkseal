import { hash } from "starknet";
import { connect } from "get-starknet";

export async function connectWallet() {
  const starknet = await connect();
  if (!starknet) throw new Error("User rejected wallet connection");
  
  await (starknet as any).enable();
  return starknet;
}

export function hashVote(choice: string, salt: string) {
  // Simple poseidon hash for MVP
  return hash.computePoseidonHash(choice, salt);
}

export const VOTING_ABI = [
  {
    "name": "IVoting",
    "type": "interface",
    "items": [
      {
        "name": "create_poll",
        "type": "function",
        "inputs": [
          { "name": "voting_end", "type": "core::integer::u64" },
          { "name": "reveal_end", "type": "core::integer::u64" }
        ],
        "outputs": [{ "type": "core::integer::u64" }],
        "state_mutability": "external"
      },
      {
        "name": "commit_vote",
        "type": "function",
        "inputs": [
          { "name": "poll_id", "type": "core::integer::u64" },
          { "name": "vote_hash", "type": "core::felt252" }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "reveal_vote",
        "type": "function",
        "inputs": [
          { "name": "poll_id", "type": "core::integer::u64" },
          { "name": "choice", "type": "core::integer::u128" },
          { "name": "salt", "type": "core::felt252" }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_poll_info",
        "type": "function",
        "inputs": [
          { "name": "poll_id", "type": "core::integer::u64" }
        ],
        "outputs": [
          { "type": "(core::felt252, core::integer::u64, core::integer::u64, core::integer::u128, core::integer::u128)" }
        ],
        "state_mutability": "view"
      }
    ]
  }
];
