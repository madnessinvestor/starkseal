import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useAuction } from "@/hooks/use-auctions";
import { Layout } from "@/components/layout";
import { CountdownTimer } from "@/components/countdown-timer";
import { hashBid, AUCTION_ABI } from "@/lib/starknet";
import { saveBidLocally, getBidForAuction, updateBidStatus } from "@/lib/starknet-mock";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Eye, EyeOff, Hash, Lock, CheckCircle2 } from "lucide-react";
import { connect } from "get-starknet";
import { Contract } from "starknet";

export default function AuctionDetails() {
  // ... (rest of the component remains the same)
}

function CommitForm({ auctionId }: { auctionId: number }) {
  const [amount, setAmount] = useState("");
  const [salt, setSalt] = useState("");
  const [commitment, setCommitment] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: auction } = useAuction(auctionId);

  const handleGenerate = async () => {
    if (!amount) return;
    setIsCalculating(true);
    const newSalt = "0x" + Math.random().toString(16).slice(2);
    const hash = hashBid(amount, newSalt);
    setSalt(newSalt);
    setCommitment(hash);
    setIsCalculating(false);
  };

  const handleSubmit = async () => {
    if (!commitment || !amount || !salt || !auction) return;
    setIsSubmitting(true);
    
    try {
      const starknet = await connect();
      if (!starknet) throw new Error("Connect wallet");
      const sn = starknet as any;
      
      const contractAddress = import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS;
      const contract = new Contract(AUCTION_ABI, contractAddress, sn.account);
      
      const { transaction_hash } = await contract.commit_bid(auction.contractAuctionId, commitment);
      
      saveBidLocally({
        auctionId,
        amount: Number(amount),
        salt,
        txHash: transaction_hash,
        status: 'committed'
      });

      toast({ title: "Commitment Submitted", description: "Hash sent to Starknet." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  // ... (rest of CommitForm)
}

function RevealForm({ auctionId }: { auctionId: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const bid = getBidForAuction(auctionId);
  const { data: auction } = useAuction(auctionId);

  const handleReveal = async () => {
    if (!bid || !auction) return;
    setIsSubmitting(true);
    
    try {
      const starknet = await connect();
      if (!starknet) throw new Error("Connect wallet");
      const sn = starknet as any;
      
      const contractAddress = import.meta.env.VITE_AUCTION_CONTRACT_ADDRESS;
      const contract = new Contract(AUCTION_ABI, contractAddress, sn.account);
      
      const { transaction_hash } = await contract.reveal_bid(auction.contractAuctionId, bid.amount, bid.salt);
      await sn.provider.waitForTransaction(transaction_hash);
      
      updateBidStatus(auctionId, 'revealed');
      toast({ title: "Bid Revealed!", description: `Successfully revealed ${bid.amount} ETH.` });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  // ... (rest of RevealForm)
}

function StatusStep({ active, completed, title, desc }: { active: boolean, completed: boolean, title: string, desc: string }) {
  return (
    <div className={`flex items-start gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-2 h-2 rounded-full mt-2 ${completed ? 'bg-primary' : active ? 'bg-yellow-500 animate-pulse' : 'bg-muted'}`} />
      <div>
        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-muted-foreground'}`}>{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <Layout>
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-primary font-mono animate-pulse">ESTABLISHING_UPLINK...</p>
        </div>
      </div>
    </Layout>
  );
}

function NotFoundScreen() {
  return (
    <Layout>
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-destructive mb-4">404 // DATA_LOSS</h1>
        <p className="text-muted-foreground">The requested auction stream could not be found.</p>
      </div>
    </Layout>
  );
}

function GavelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground w-12 h-12">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/>
      <path d="m16 16 6-6"/>
      <path d="m8 8 6-6"/>
      <path d="m9 7 8 8"/>
      <path d="m21 11-8-8"/>
    </svg>
  );
}
