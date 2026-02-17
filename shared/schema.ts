import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contractAuctionId: integer("contract_auction_id"), // ID on Starknet
  transactionHash: text("transaction_hash"), // Creation tx hash
  sellerAddress: text("seller_address").notNull(), // Starknet address
  biddingEndsAt: timestamp("bidding_ends_at").notNull(),
  revealEndsAt: timestamp("reveal_ends_at").notNull(),
  status: text("status").default("pending"), // pending, active, completed
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({ 
  id: true, 
  contractAuctionId: true, 
  transactionHash: true,
  status: true 
});

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
