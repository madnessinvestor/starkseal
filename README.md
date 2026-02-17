# StarkSeal - Privacy-Preserving Auction on Starknet

## Overview
StarkSeal is a sealed-bid auction system built on Starknet using Cairo. It ensures bid privacy during the bidding phase using a commit-reveal scheme.

## Prerequisites
- Starknet Wallet (Argent X or Braavos)
- Scarb (Cairo package manager)
- Node.js & npm

## Deployment to Sepolia
1. Configure your wallet to Starknet Sepolia.
2. Build the contract:
   ```bash
   cd contracts && scarb build
   ```
3. Deploy using Starkli or your preferred tool.
4. Update `VITE_AUCTION_CONTRACT_ADDRESS` in your environment.

## Running the Demo
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Connect your wallet using the "Connect Wallet" button.
4. Create an auction, commit a bid, and reveal it after the bidding phase ends.
