import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Auction (Metadata)
  app.post(api.auctions.create.path, async (req, res) => {
    try {
      const input = api.auctions.create.input.parse(req.body);
      const auction = await storage.createAuction(input);
      res.status(201).json(auction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // List Auctions
  app.get(api.auctions.list.path, async (req, res) => {
    const auctions = await storage.getAuctions();
    res.json(auctions);
  });

  // Get Auction
  app.get(api.auctions.get.path, async (req, res) => {
    const auction = await storage.getAuction(Number(req.params.id));
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    res.json(auction);
  });

  // Update Contract ID (after on-chain creation)
  app.patch(api.auctions.updateContractId.path, async (req, res) => {
    try {
      const { contractAuctionId, transactionHash } = req.body;
      const updated = await storage.updateAuctionContractId(
        Number(req.params.id), 
        contractAuctionId,
        transactionHash
      );
      if (!updated) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
