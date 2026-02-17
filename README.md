# StarkVote - Privacy-Preserving Voting on Starknet

## Overview
StarkVote is a privacy-preserving voting system on Starknet. It ensures vote confidentiality by using a cryptographic **Commit-Reveal** scheme. Individual votes remain hidden until the reveal phase, preventing social pressure or bandwagon effects.

### Why Privacy Matters
In standard on-chain voting, every vote is public and immutable. This can lead to voter coercion or tactical voting based on real-time tallies. StarkVote ensures that no one (including the poll creator) knows how someone voted until the reveal phase.

### How Commit-Reveal Voting Works
1. **Commit Phase**: Voters submit a hash of their choice and a secret nonce (`Poseidon(choice, salt)`). The actual vote is hidden.
2. **Reveal Phase**: Once voting ends, voters "reveal" their vote by submitting the original `choice` and `salt`. The contract verifies the hash matches the commitment.
3. **Tallying**: The contract automatically tallies the revealed votes to show the final result.

## Starknet Sepolia Deployment
1. Build the contract:
   ```bash
   cd contracts && scarb build
   ```
2. Set environment variables in `.env`:
   - `DEPLOYER_ADDRESS`
   - `DEPLOYER_PRIVATE_KEY`
   - `VITE_STARKNET_RPC_URL`
3. Deploy:
   ```bash
   npx tsx script/deploy.ts
   ```

## Demo Flow
1. Connect Argent X or Braavos wallet (Sepolia).
2. Create a poll with `Voting End` and `Reveal End` timestamps.
3. Voters commit votes during the voting phase.
4. Voters reveal votes during the reveal phase.
5. View the final tally once reveals are processed.
