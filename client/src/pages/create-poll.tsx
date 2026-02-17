import { useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePoll, useUpdateContractId } from "@/hooks/use-polls";
import { insertPollSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { connect } from "get-starknet";
import { Contract } from "starknet";
import { VOTING_ABI } from "@/lib/starknet";

const formSchema = insertPollSchema.extend({
  votingEndsAt: z.date(),
  revealEndsAt: z.date(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreatePoll() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createPoll } = useCreatePoll();
  const { mutateAsync: updateContractId } = useUpdateContractId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorAddress: "0x0",
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const starknet = await connect();
      if (!starknet) throw new Error("Please connect your wallet");
      const sn = starknet as any;
      if (sn.enable) await sn.enable();
      
      const contractAddress = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Contract address not configured");

      const votingContract = new Contract(VOTING_ABI, contractAddress, sn.account);
      
      const votingEnd = Math.floor(data.votingEndsAt.getTime() / 1000);
      const revealEnd = Math.floor(data.revealEndsAt.getTime() / 1000);

      toast({ title: "Starknet Transaction", description: "Please confirm the transaction in your wallet." });
      
      const { transaction_hash } = await votingContract.create_poll(votingEnd, revealEnd);
      toast({ title: "Transaction Sent", description: `Hash: ${transaction_hash.substring(0, 10)}...` });

      await sn.provider.waitForTransaction(transaction_hash);

      const contractPollId = Math.floor(Math.random() * 10000); // Temporary for demo

      const poll = await createPoll({
        ...data,
        creatorAddress: sn.selectedAddress
      });
      
      await updateContractId({
        id: poll.id,
        contractPollId: contractPollId,
        transactionHash: transaction_hash
      });

      toast({ title: "Success", description: "Poll created on Starknet." });
      setLocation("/");
      
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black mb-2 glitch-text">INIT_NEW_POLL</h1>
          <p className="text-muted-foreground font-mono text-sm">
            Deploy a new private voting poll to Starknet.
          </p>
        </header>

        <div className="cyber-card p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase tracking-wider">
                POLL_TITLE
              </label>
              <input
                {...form.register("title")}
                className="w-full cyber-input p-3 rounded-none outline-none font-mono"
                placeholder="e.g. Governance Proposal #1"
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase tracking-wider">
                DESCRIPTION
              </label>
              <textarea
                {...form.register("description")}
                className="w-full cyber-input p-3 rounded-none outline-none font-mono h-32"
                placeholder="Details about the proposal..."
              />
              {form.formState.errors.description && (
                <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2 opacity-60">
              <label className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                CREATOR_ADDRESS <Info className="w-3 h-3" />
              </label>
              <input
                {...form.register("creatorAddress")}
                readOnly
                className="w-full cyber-input p-3 rounded-none outline-none font-mono bg-black/80 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary uppercase tracking-wider">
                  VOTING_DEADLINE
                </label>
                <DatePicker 
                  selected={form.watch("votingEndsAt")}
                  onSelect={(date) => form.setValue("votingEndsAt", date as Date)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-primary uppercase tracking-wider">
                  REVEAL_DEADLINE
                </label>
                <DatePicker 
                  selected={form.watch("revealEndsAt")}
                  onSelect={(date) => form.setValue("revealEndsAt", date as Date)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-primary/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cyber-button flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> DEPLOYING...
                  </>
                ) : (
                  <>
                    CREATE_POLL <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function DatePicker({ selected, onSelect }: { selected: Date | undefined, onSelect: (date: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full cyber-input p-3 rounded-none outline-none font-mono flex items-center justify-between text-left">
          {selected ? format(selected, "PPP") : <span className="text-primary/30">Pick a date</span>}
          <CalendarIcon className="h-4 w-4 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-black border border-primary/50 text-primary">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          initialFocus
          className="bg-black text-primary"
        />
      </PopoverContent>
    </Popover>
  );
}
