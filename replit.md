# StarkSeal - Privacy-Preserving Voting on Starknet

## Overview

StarkSeal is a privacy-preserving voting platform built on Starknet. It uses a cryptographic Commit-Reveal scheme to ensure vote confidentiality. The application consists of a React frontend with a cyberpunk aesthetic, an Express backend API, a PostgreSQL database, and Cairo smart contracts.

The core voting flow:
1. Users create polls with voting and reveal deadlines.
2. Voters commit hashed votes (`Poseidon(choice, salt)`) during the voting phase.
3. Voters reveal their actual choices during the reveal phase.
4. The system tallies and displays the final results.

## Recent Changes (2026-02-17)
- Adapted the codebase from an auction platform to a private voting system.
- Updated Cairo contract `voting.cairo` with commit-reveal logic.
- Updated React frontend with `PollDetails` supporting commit and reveal phases.
- Synchronized PostgreSQL schema with `option_1_votes` and `option_2_votes`.
- Added automated result syncing from Starknet to the local database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)
- **Location**: `client/` directory
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` for client-side routing (pages: Home, Create Auction, Auction Details, My Bids, 404)
- **State Management**: `@tanstack/react-query` for server state, local React state for forms
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS), located in `client/src/components/ui/`
- **Styling**: Tailwind CSS with a cyberpunk theme (dark mode, neon green accents, monospace fonts JetBrains Mono and Oxanium, sharp corners)
- **Form Handling**: `react-hook-form` with `zod` validation via `@hookform/resolvers`
- **Starknet Integration**: `get-starknet` for wallet connection (Argent X / Braavos), `starknet` JS library for contract interactions. A mock layer (`lib/starknet-mock.ts`) provides SHA-256-based hash simulation and localStorage persistence for bid secrets
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (Express + Node.js)
- **Location**: `server/` directory
- **Framework**: Express.js with TypeScript, run via `tsx`
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves static files in production or Vite dev middleware in development
- **API Routes**: Defined in `server/routes.ts`, following patterns declared in `shared/routes.ts`
- **Static serving**: In production, serves built frontend from `dist/public`; in development, Vite dev server middleware handles it (`server/vite.ts`)

### API Structure
All endpoints are under `/api/auctions`:
- `GET /api/auctions` — List all auctions
- `POST /api/auctions` — Create a new auction (metadata only, off-chain)
- `GET /api/auctions/:id` — Get a single auction
- `PATCH /api/auctions/:id/contract-id` — Update auction with on-chain contract ID and transaction hash after deployment

API input/output schemas are defined with Zod in `shared/routes.ts` and validated server-side.

### Shared Layer
- **Location**: `shared/` directory
- **Schema**: `shared/schema.ts` defines the Drizzle ORM schema and Zod validation schemas (used by both client and server)
- **Routes**: `shared/routes.ts` defines API route contracts (paths, methods, input/output schemas)

### Database
- **Technology**: PostgreSQL via Drizzle ORM
- **Configuration**: `drizzle.config.ts` at project root, requires `DATABASE_URL` environment variable
- **Connection**: `server/db.ts` creates a `pg.Pool` and Drizzle instance
- **Schema**: Single `auctions` table with fields: `id`, `title`, `description`, `contractAuctionId`, `transactionHash`, `sellerAddress`, `biddingEndsAt`, `revealEndsAt`, `status`
- **Migrations**: Output to `./migrations` directory; push schema with `npm run db:push`

### Storage Layer
- `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class using Drizzle queries
- Operations: create auction, get auction(s), update contract ID

### Build System
- **Development**: `npm run dev` runs `tsx server/index.ts` with Vite dev middleware
- **Production build**: `npm run build` runs `script/build.ts` which builds the Vite frontend to `dist/public` and bundles the server with esbuild to `dist/index.cjs`
- **Production start**: `npm start` runs `node dist/index.cjs`

### Smart Contract Deployment
- **Contract language**: Cairo (Starknet), built with Scarb in `contracts/` directory
- **Deployment script**: `script/deploy.ts` uses `starknet` JS library to declare and deploy contracts to Starknet Sepolia
- **Required env vars**: `DEPLOYER_ADDRESS`, `DEPLOYER_PRIVATE_KEY`, `VITE_STARKNET_RPC_URL`, `VITE_AUCTION_CONTRACT_ADDRESS`

## External Dependencies

### Database
- **PostgreSQL** — Primary data store for auction metadata, connected via `DATABASE_URL` environment variable

### Blockchain
- **Starknet (Sepolia testnet)** — On-chain auction smart contracts using Commit-Reveal scheme
- **`starknet` npm package** — For contract interactions, Poseidon hashing, and deployment
- **`get-starknet`** — Wallet connection library supporting Argent X and Braavos wallets
- **RPC endpoint** — Configurable via `VITE_STARKNET_RPC_URL` (defaults to `https://starknet-sepolia.public.blastapi.io`)

### Key npm Packages
- **Drizzle ORM + drizzle-kit** — Database ORM and migration tooling
- **Express** — HTTP server framework
- **Vite** — Frontend dev server and bundler
- **React + React DOM** — UI framework
- **@tanstack/react-query** — Async state management
- **Radix UI** — Headless UI primitives (full shadcn/ui component set)
- **Tailwind CSS** — Utility-first CSS framework
- **Zod** — Schema validation (shared between client and server)
- **react-hook-form** — Form state management
- **wouter** — Lightweight client-side router
- **date-fns** — Date formatting and manipulation
- **lucide-react** — Icon library
- **dotenv** — Environment variable loading

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `DEPLOYER_ADDRESS` — Starknet deployer wallet address
- `DEPLOYER_PRIVATE_KEY` — Starknet deployer private key
- `VITE_STARKNET_RPC_URL` — Starknet RPC endpoint
- `VITE_AUCTION_CONTRACT_ADDRESS` — Deployed auction contract address on Starknet