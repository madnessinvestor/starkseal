
// Mock types for Starknet interactions
export interface AuctionCommitment {
  auctionId: number;
  commitment: string; // Hash
  timestamp: number;
}

export interface BidLocalData {
  amount: number;
  salt: string;
  auctionId: number;
  txHash: string;
  status: 'committed' | 'revealed';
}

// Simple Poseidon-like hash simulation for the frontend
export const poseidonHash = async (amount: number, salt: string): Promise<string> => {
  // In a real app, this would use starknet.js poseidon hash
  // Here we just use SHA-256 for the mock to be deterministic
  const msg = `${amount}-${salt}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(msg);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex.substring(0, 60)}`; // Truncate to look like a felt
};

export const generateSalt = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Local storage helper for keeping track of user's secrets
const STORAGE_KEY = 'starkseal_bids';

export const saveBidLocally = (bid: BidLocalData) => {
  const existing = getLocalBids();
  existing.push(bid);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const updateBidStatus = (auctionId: number, status: 'revealed') => {
  const bids = getLocalBids();
  const bidIndex = bids.findIndex(b => b.auctionId === auctionId);
  if (bidIndex !== -1) {
    bids[bidIndex].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bids));
  }
};

export const getLocalBids = (): BidLocalData[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getBidForAuction = (auctionId: number): BidLocalData | undefined => {
  return getLocalBids().find(b => b.auctionId === auctionId);
};
