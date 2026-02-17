import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useAuction } from "@/hooks/use-auctions";
import { Layout } from "@/components/layout";
import { CountdownTimer } from "@/components/countdown-timer";
import { poseidonHash, generateSalt, saveBidLocally, getBidForAuction, updateBidStatus } from "@/lib/starknet-mock";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Eye, EyeOff, Hash, Lock, CheckCircle2 } from "lucide-react";
import { z } from "zod";

export default function AuctionDetails() {
  const [match, params] = useRoute("/auction/:id");
  const id = parseInt(params?.id || "0");
  const { data: auction, isLoading } = useAuction(id);
  
  if (isLoading) return <LoadingScreen />;
  if (!auction) return <NotFoundScreen />;

  const isCommitPhase = new Date() < new Date(auction.biddingEndsAt);
  const isRevealPhase = !isCommitPhase && new Date() < new Date(auction.revealEndsAt);
  const isEnded = new Date() > new Date(auction.revealEndsAt);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cyber-card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-black mb-2 text-white">{auction.title}</h1>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-2 py-1 border border-primary/20">
                    ID: #{auction.contractAuctionId || "PENDING"}
                  </span>
                  <span>SELLER: {auction.sellerAddress.substring(0, 8)}...</span>
                </div>
              </div>
              {isCommitPhase && <div className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/50 text-xs font-bold animate-pulse">LIVE</div>}
            </div>

            <div className="prose prose-invert max-w-none text-muted-foreground font-mono">
              <p>{auction.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-primary/20">
              <div className="bg-black/40 p-4 border border-primary/10">
                <span className="text-xs text-muted-foreground block mb-2">COMMIT PHASE ENDS</span>
                <CountdownTimer targetDate={auction.biddingEndsAt} />
              </div>
              <div className="bg-black/40 p-4 border border-primary/10">
                <span className="text-xs text-muted-foreground block mb-2">REVEAL PHASE ENDS</span>
                <CountdownTimer targetDate={auction.revealEndsAt} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="cyber-card p-6 border-t-4 border-t-primary">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              AUCTION_STATUS
            </h3>
            
            <div className="space-y-4">
              <StatusStep 
                active={isCommitPhase} 
                completed={!isCommitPhase} 
                title="1. COMMIT PHASE" 
                desc="Submit encrypted bid hash." 
              />
              <StatusStep 
                active={isRevealPhase} 
                completed={isEnded} 
                title="2. REVEAL PHASE" 
                desc="Reveal amount & salt." 
              />
              <StatusStep 
                active={isEnded} 
                completed={false} 
                title="3. FINALIZATION" 
                desc="Winner determined on-chain." 
              />
            </div>
          </div>

          {/* Action Card */}
          <div className="cyber-card p-6">
            {isCommitPhase ? (
              <CommitForm auctionId={id} />
            ) : isRevealPhase ? (
              <RevealForm auctionId={id} />
            ) : (
              <div className="text-center py-8">
                <GavelIcon />
                <h3 className="text-lg font-bold mt-4">AUCTION CLOSED</h3>
                <p className="text-sm text-muted-foreground">Winner calculation pending...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CommitForm({ auctionId }: { auctionId: number }) {
  const [amount, setAmount] = useState("");
  const [salt, setSalt] = useState("");
  const [commitment, setCommitment] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!amount) return;
    setIsCalculating(true);
    const newSalt = generateSalt();
    const hash = await poseidonHash(Number(amount), newSalt);
    setSalt(newSalt);
    setCommitment(hash);
    setIsCalculating(false);
  };

  const handleSubmit = async () => {
    if (!commitment || !amount || !salt) return;
    setIsSubmitting(true);
    
    // Simulate Blockchain Transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTxHash = "0x" + Math.random().toString(16).slice(2);
    
    // Save locally
    saveBidLocally({
      auctionId,
      amount: Number(amount),
      salt,
      txHash: mockTxHash,
      status: 'committed'
    });

    toast({
      title: "Commitment Submitted",
      description: "Hash sent to Starknet. Salt saved locally.",
    });
    setIsSubmitting(false);
  };

  const existingBid = getBidForAuction(auctionId);
  if (existingBid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <CheckCircle2 className="w-5 h-5" />
          BID COMMITTED
        </div>
        <div className="bg-primary/5 p-4 rounded text-xs font-mono space-y-2 border border-primary/20">
          <p className="text-muted-foreground">You have already committed a bid for this auction.</p>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="text-white blur-sm hover:blur-none transition-all">{existingBid.amount} ETH</span>
          </div>
          <div className="flex justify-between">
            <span>Salt:</span>
            <span className="text-white blur-sm hover:blur-none transition-all">{existingBid.salt}</span>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">Wait for Reveal Phase to open.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">PLACE_SEALED_BID</h3>
      
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground">BID AMOUNT (ETH)</label>
        <input 
          type="number" 
          className="w-full cyber-input p-3" 
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="pt-2">
        <button 
          onClick={handleGenerate}
          disabled={!amount || isCalculating}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 text-xs font-mono border border-primary/20 transition-colors mb-4"
        >
          {isCalculating ? "HASHING..." : "1. GENERATE COMMITMENT HASH"}
        </button>
      </div>

      {commitment && (
        <div className="bg-black/50 p-4 border border-primary/30 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" /> COMMITMENT HASH
            </label>
            <div className="text-xs font-mono break-all text-primary">{commitment}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> SECRET SALT
            </label>
            <div className="text-xs font-mono break-all text-muted-foreground blur-[2px] hover:blur-none transition-all cursor-help">
              {salt}
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleSubmit}
        disabled={!commitment || isSubmitting}
        className="w-full cyber-button disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "2. SUBMIT TO CHAIN"}
      </button>
      
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Your bid amount is hidden. Only the hash is stored on-chain.
      </p>
    </div>
  );
}

function RevealForm({ auctionId }: { auctionId: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const bid = getBidForAuction(auctionId);

  const handleReveal = async () => {
    if (!bid) return;
    setIsSubmitting(true);
    
    // Simulate Reveal Transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateBidStatus(auctionId, 'revealed');
    
    toast({
      title: "Bid Revealed!",
      description: `Successfully revealed ${bid.amount} ETH.`,
    });
    setIsSubmitting(false);
    window.location.reload(); // Quick refresh to update UI state
  };

  if (!bid) {
    return (
      <div className="text-center py-8">
        <EyeOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">No local commitment found for this auction.</p>
      </div>
    );
  }

  if (bid.status === 'revealed') {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
        <h3 className="font-bold text-primary">REVEAL CONFIRMED</h3>
        <p className="text-sm text-muted-foreground">Your bid is now public and valid.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg mb-4 text-yellow-500">REVEAL_PHASE_OPEN</h3>
      
      <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Stored Amount:</span>
          <span className="font-mono text-white">{bid.amount} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Secret Salt:</span>
          <span className="font-mono text-white blur-sm hover:blur-none">{bid.salt}</span>
        </div>
      </div>

      <button 
        onClick={handleReveal}
        disabled={isSubmitting}
        className="w-full cyber-button border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.6)]"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "REVEAL MY BID"}
      </button>
    </div>
  );
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
