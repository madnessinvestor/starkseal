# StarkSeal - Privacy-Preserving Auction on Starknet

## Overview
StarkSeal is a privacy-preserving sealed-bid auction on Starknet. It solves the "front-running" and "copy-cat bidding" problems in public auctions by using a cryptographic **Commit-Reveal** scheme.

### Why Privacy Matters
In standard on-chain auctions, every bid is public. This allows competitors to see exactly what others are bidding and outbid them by the smallest possible margin, or simply copy their strategy. StarkSeal ensures that bids remain secret until the bidding phase is officially over.

### How Commit-Reveal Works
1. **Commit Phase**: Bidders submit a hash of their bid (`Poseidon(amount, salt)`). The actual amount is hidden.
2. **Reveal Phase**: Once bidding ends, bidders "reveal" their bid by submitting the original `amount` and `salt`. The contract verifies the hash matches the commitment.
3. **Winner Selection**: The highest verified bid wins.

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
2. Create an auction with `Bidding End` and `Reveal End` timestamps.
3. Users commit bids during the bidding phase.
4. Users reveal bids during the reveal phase.
5. View the winner once reveals are processed.
