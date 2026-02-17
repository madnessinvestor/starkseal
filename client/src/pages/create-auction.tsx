import { useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAuction, useUpdateContractId } from "@/hooks/use-auctions";
import { insertAuctionSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { connect } from "get-starknet";
import { Contract } from "starknet";
import { AUCTION_ABI } from "@/lib/starknet";

// Schema for the form
const formSchema = insertAuctionSchema.extend({
  biddingEndsAt: z.date(),
  revealEndsAt: z.date(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAuction() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createAuction } = useCreateAuction();
  const { mutateAsync: updateContractId } = useUpdateContractId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerAddress: "0x0",
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const starknet = await connect();
      if (!starknet) throw new Error("Please connect your wallet");
      const sn = starknet as any;
      if (sn.enable) await sn.enable();
      
      const contractAddress = import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Contract address not configured");

      const auctionContract = new Contract(AUCTION_ABI, contractAddress, sn.account);
      
      const biddingEnd = Math.floor(data.biddingEndsAt.getTime() / 1000);
      const revealEnd = Math.floor(data.revealEndsAt.getTime() / 1000);

      toast({ title: "Starknet Transaction", description: "Please confirm the transaction in your wallet." });
      
      const { transaction_hash } = await auctionContract.create_auction(biddingEnd, revealEnd);
      toast({ title: "Transaction Sent", description: `Hash: ${transaction_hash.substring(0, 10)}...` });

      // Wait for transaction
      await sn.provider.waitForTransaction(transaction_hash);

      // In a real app, we'd parse events to get the auction_id. 
      // For MVP, we'll use a sequential ID or mock for now as event parsing is complex.
      const contractAuctionId = Math.floor(Math.random() * 10000); // Temporary

      const auction = await createAuction({
        ...data,
        sellerAddress: sn.selectedAddress
      });
      
      await updateContractId({
        id: auction.id,
        contractAuctionId: contractAuctionId,
        transactionHash: transaction_hash
      });

      toast({ title: "Success", description: "Auction created on Starknet." });
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
          <h1 className="text-3xl font-black mb-2 glitch-text">INIT_NEW_AUCTION</h1>
          <p className="text-muted-foreground font-mono text-sm">
            Deploy a new sealed-bid auction contract to Starknet.
          </p>
        </header>

        <div className="cyber-card p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase tracking-wider">
                ITEM_TITLE
              </label>
              <input
                {...form.register("title")}
                className="w-full cyber-input p-3 rounded-none outline-none font-mono"
                placeholder="e.g. Rare NFT #4021"
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase tracking-wider">
                DESCRIPTION
              </label>
              <textarea
                {...form.register("description")}
                className="w-full cyber-input p-3 rounded-none outline-none font-mono h-32"
                placeholder="Details about the item..."
              />
              {form.formState.errors.description && (
                <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Seller Address */}
            <div className="space-y-2 opacity-60">
              <label className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                SELLER_ADDRESS <Info className="w-3 h-3" />
              </label>
              <input
                {...form.register("sellerAddress")}
                readOnly
                className="w-full cyber-input p-3 rounded-none outline-none font-mono bg-black/80 cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">Using connected wallet address (Mock)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bidding Ends At */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary uppercase tracking-wider">
                  COMMIT_DEADLINE
                </label>
                <DatePicker 
                  selected={form.watch("biddingEndsAt")}
                  onSelect={(date) => form.setValue("biddingEndsAt", date as Date)}
                />
                {form.formState.errors.biddingEndsAt && (
                  <p className="text-destructive text-xs">{form.formState.errors.biddingEndsAt.message}</p>
                )}
              </div>

              {/* Reveal Ends At */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary uppercase tracking-wider">
                  REVEAL_DEADLINE
                </label>
                <DatePicker 
                  selected={form.watch("revealEndsAt")}
                  onSelect={(date) => form.setValue("revealEndsAt", date as Date)}
                />
                {form.formState.errors.revealEndsAt && (
                  <p className="text-destructive text-xs">{form.formState.errors.revealEndsAt.message}</p>
                )}
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
                    DEPLOY_CONTRACT <span className="group-hover:translate-x-1 transition-transform">→</span>
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
