import { db } from "./db";
import { polls, type InsertPoll, type Poll } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Poll methods
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPoll(id: number): Promise<Poll | undefined>;
  getPolls(): Promise<Poll[]>;
  updatePollContractId(id: number, contractId: number, txHash: string): Promise<Poll | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const [poll] = await db.insert(polls).values(insertPoll).returning();
    return poll;
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async getPolls(): Promise<Poll[]> {
    return await db.select().from(polls);
  }

  async updatePollContractId(id: number, contractId: number, txHash: string): Promise<Poll | undefined> {
    const [updated] = await db
      .update(polls)
      .set({ contractPollId: contractId, transactionHash: txHash, status: "active" })
      .where(eq(polls.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
