import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Poll (Metadata)
  app.post(api.polls.create.path, async (req, res) => {
    try {
      const input = api.polls.create.input.parse(req.body);
      const poll = await storage.createPoll(input);
      res.status(201).json(poll);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // List Polls
  app.get(api.polls.list.path, async (req, res) => {
    const polls = await storage.getPolls();
    res.json(polls);
  });

  // Get Poll
  app.get(api.polls.get.path, async (req, res) => {
    const poll = await storage.getPoll(Number(req.params.id));
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }
    res.json(poll);
  });

  // Update Contract ID (after on-chain creation)
  app.patch(api.polls.updateContractId.path, async (req, res) => {
    try {
      const { contractPollId, transactionHash } = req.body;
      const updated = await storage.updatePollContractId(
        Number(req.params.id), 
        contractPollId,
        transactionHash
      );
      if (!updated) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sync Poll Results from Chain
  app.post("/api/polls/:id/sync", async (req, res) => {
    try {
      const { option1, option2 } = req.body;
      const updated = await (storage as any).updatePollResults(
        Number(req.params.id),
        option1,
        option2
      );
      if (!updated) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
