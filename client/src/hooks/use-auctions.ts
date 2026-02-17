import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes"; // Ensure this matches your shared/routes.ts export
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Schema types derived from Zod
type Auction = z.infer<typeof api.auctions.list.responses[200]>[0];
type CreateAuctionInput = z.infer<typeof api.auctions.create.input>;

export function useAuctions() {
  return useQuery({
    queryKey: [api.auctions.list.path],
    queryFn: async () => {
      const res = await fetch(api.auctions.list.path);
      if (!res.ok) throw new Error("Failed to fetch auctions");
      return api.auctions.list.responses[200].parse(await res.json());
    },
  });
}

export function useAuction(id: number) {
  return useQuery({
    queryKey: [api.auctions.get.path, id],
    queryFn: async () => {
      const url = api.auctions.get.path.replace(":id", String(id));
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch auction");
      return api.auctions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAuctionInput) => {
      const res = await fetch(api.auctions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create auction");
      }
      
      return api.auctions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auctions.list.path] });
      toast({
        title: "Auction Initialized",
        description: "Contract deployment simulation started.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContractId() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contractAuctionId, transactionHash }: { id: number, contractAuctionId: number, transactionHash: string }) => {
      const url = api.auctions.updateContractId.path.replace(":id", String(id));
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAuctionId, transactionHash }),
      });
      
      if (!res.ok) throw new Error("Failed to update auction with contract ID");
      return api.auctions.updateContractId.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auctions.list.path] });
    }
  });
}
