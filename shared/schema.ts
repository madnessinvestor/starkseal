import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contractPollId: integer("contract_poll_id"), // ID on Starknet
  transactionHash: text("transaction_hash"), // Creation tx hash
  creatorAddress: text("creator_address").notNull(), // Starknet address
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  revealEndsAt: timestamp("reveal_ends_at").notNull(),
  status: text("status").default("pending"), // pending, active, completed
  option_1_votes: integer("option_1_votes").default(0),
  option_2_votes: integer("option_2_votes").default(0),
});

export const insertPollSchema = createInsertSchema(polls).omit({ 
  id: true, 
  contractPollId: true, 
  transactionHash: true,
  status: true 
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
