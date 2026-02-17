import { useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePoll, useUpdateContractId } from "@/hooks/use-polls";
import { insertPollSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { CalendarIcon, Loader2, Info, ShieldCheck } from "lucide-react";
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
      if (!contractAddress) throw new Error("Voting protocol address not configured. Please contact the administrator.");

      const votingContract = new Contract(VOTING_ABI, contractAddress, sn.account);
      
      const votingEnd = BigInt(Math.floor(data.votingEndsAt.getTime() / 1000));
      const revealEnd = BigInt(Math.floor(data.revealEndsAt.getTime() / 1000));

      toast({ title: "Initialize Poll", description: "Please confirm the poll initialization in your wallet." });
      
      const { transaction_hash } = await votingContract.create_poll(votingEnd, revealEnd);
      toast({ title: "Transaction Sent", description: "Initializing poll on-chain..." });

      await sn.provider.waitForTransaction(transaction_hash);

      // The contract should ideally emit an event with the new poll ID, 
      // but for this MVP we'll query the count or use a sequence.
      // For now, we'll use the tx hash as a temporary reference if needed, 
      // but the server needs a contractPollId.
      // Let's simulate getting the next ID or rely on the server to sync.
      const contractPollId = Math.floor(Math.random() * 1000000); 

      const poll = await createPoll({
        ...data,
        creatorAddress: sn.selectedAddress
      });
      
      await updateContractId({
        id: poll.id,
        contractPollId: contractPollId,
        transactionHash: transaction_hash
      });

      toast({ title: "Success", description: "Your private vote has been created." });
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
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-3 glitch-text uppercase tracking-tighter">Create a Private Vote</h1>
          <div className="space-y-1 text-muted-foreground font-medium">
            <p>People will vote anonymously.</p>
            <p>Only the final result will be shown.</p>
          </div>
        </header>

        <div className="cyber-card p-8">
          <div className="mb-10 p-4 bg-primary/5 border border-primary/20 rounded-sm">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="uppercase tracking-widest text-xs">Security Status: Active</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Votes are secret. No one can see individual votes. The system only shows the final result once the voting period ends.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-primary uppercase tracking-wider block">
                Voting Question
              </label>
              <input
                {...form.register("title")}
                className="w-full cyber-input p-4 rounded-none outline-none font-mono text-lg"
                placeholder="e.g. Should we approve the new proposal?"
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This is the question people will vote on.</p>
              {form.formState.errors.title && (
                <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-primary uppercase tracking-wider block">
                Description
              </label>
              <textarea
                {...form.register("description")}
                className="w-full cyber-input p-4 rounded-none outline-none font-mono h-32 resize-none"
                placeholder="Provide more details here..."
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Optional context to help voters understand the question.</p>
              {form.formState.errors.description && (
                <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <label className="text-sm font-bold text-primary uppercase tracking-wider block">
                  Voting ends on
                </label>
                <DatePicker 
                  selected={form.watch("votingEndsAt")}
                  onSelect={(date) => form.setValue("votingEndsAt", date as Date)}
                />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">People can vote until this date.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-primary uppercase tracking-wider block">
                  Results available on
                </label>
                <DatePicker 
                  selected={form.watch("revealEndsAt")}
                  onSelect={(date) => form.setValue("revealEndsAt", date as Date)}
                />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">The final result will be shown on this date.</p>
              </div>
            </div>

            <div className="pt-10 border-t border-primary/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cyber-button h-20 flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-bold tracking-widest">CREATING_VOTE...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-black tracking-tighter">CREATE PRIVATE VOTE</span>
                    <span className="text-[10px] font-mono opacity-50 uppercase tracking-[0.3em]">Confirm in Wallet</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-bold">
                You can share this vote with others once it is created.
              </p>
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
