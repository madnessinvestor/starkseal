import { z } from "zod";
import { insertPollSchema, polls } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  polls: {
    list: {
      method: 'GET' as const,
      path: '/api/polls' as const,
      responses: {
        200: z.array(z.custom<typeof polls.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/polls' as const,
      input: insertPollSchema,
      responses: {
        201: z.custom<typeof polls.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/polls/:id' as const,
      responses: {
        200: z.custom<typeof polls.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateContractId: {
      method: 'PATCH' as const,
      path: '/api/polls/:id/contract-id' as const,
      input: z.object({ contractPollId: z.number(), transactionHash: z.string() }),
      responses: {
        200: z.custom<typeof polls.$inferSelect>(),
      },
    }
  },
};
