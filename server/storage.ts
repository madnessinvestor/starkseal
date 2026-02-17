import { db } from "./db";
import { auctions, type InsertAuction, type Auction } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Auction methods
  createAuction(auction: InsertAuction): Promise<Auction>;
  getAuction(id: number): Promise<Auction | undefined>;
  getAuctions(): Promise<Auction[]>;
  updateAuctionContractId(id: number, contractId: number, txHash: string): Promise<Auction | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const [auction] = await db.insert(auctions).values(insertAuction).returning();
    return auction;
  }

  async getAuction(id: number): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction;
  }

  async getAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions);
  }

  async updateAuctionContractId(id: number, contractId: number, txHash: string): Promise<Auction | undefined> {
    const [updated] = await db
      .update(auctions)
      .set({ contractAuctionId: contractId, transactionHash: txHash, status: "active" })
      .where(eq(auctions.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
