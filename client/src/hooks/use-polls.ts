import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Poll, InsertPoll } from "@shared/schema";

export function usePolls() {
  return useQuery<Poll[]>({
    queryKey: [api.polls.list.path],
  });
}

export function usePoll(id: number) {
  return useQuery<Poll>({
    queryKey: [api.polls.get.path.replace(":id", id.toString())],
    enabled: !!id,
  });
}

export function useCreatePoll() {
  return useMutation({
    mutationFn: async (poll: InsertPoll) => {
      const res = await apiRequest(api.polls.create.method, api.polls.create.path, poll);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.polls.list.path] });
    },
  });
}

export function useUpdateContractId() {
  return useMutation({
    mutationFn: async ({ id, contractPollId, transactionHash }: { id: number, contractPollId: number, transactionHash: string }) => {
      const res = await apiRequest(
        api.polls.updateContractId.method,
        api.polls.updateContractId.path.replace(":id", id.toString()),
        { contractPollId, transactionHash }
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.polls.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.polls.get.path.replace(":id", variables.id.toString())] });
    },
  });
}
