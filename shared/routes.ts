import { z } from 'zod';
import { insertAuctionSchema, auctions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  auctions: {
    list: {
      method: 'GET' as const,
      path: '/api/auctions' as const,
      responses: {
        200: z.array(z.custom<typeof auctions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/auctions' as const,
      input: insertAuctionSchema,
      responses: {
        201: z.custom<typeof auctions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/auctions/:id' as const,
      responses: {
        200: z.custom<typeof auctions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateContractId: { // To update with the on-chain ID after transaction confirms
      method: 'PATCH' as const,
      path: '/api/auctions/:id/contract-id' as const,
      input: z.object({ contractAuctionId: z.number(), transactionHash: z.string() }),
      responses: {
        200: z.custom<typeof auctions.$inferSelect>(),
      },
    }
  },
};
