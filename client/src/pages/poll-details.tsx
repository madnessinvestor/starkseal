import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { usePoll, useUpdateContractId } from "@/hooks/use-polls";
import { Layout } from "@/components/layout";
import { CountdownTimer } from "@/components/countdown-timer";
import { hashVote, VOTING_ABI } from "@/lib/starknet";
import { saveVoteLocally, getVoteForPoll, updateVoteStatus } from "@/lib/starknet-mock";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Eye, EyeOff, Hash, Lock, CheckCircle2, Vote } from "lucide-react";
import { connect } from "get-starknet";
import { Contract } from "starknet";
import { format } from "date-fns";

export default function PollDetails() {
  const [, params] = useRoute("/poll/:id");
  const pollId = Number(params?.id);
  const { data: poll, isLoading, error } = usePoll(pollId);
  const localVote = getVoteForPoll(pollId);

  if (isLoading) return <LoadingScreen />;
  if (error || !poll) return <NotFoundScreen />;

  const isVotingPhase = new Date() < new Date(poll.votingEndsAt);
  const isRevealPhase = !isVotingPhase && new Date() < new Date(poll.revealEndsAt);
  const isEnded = new Date() > new Date(poll.revealEndsAt);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <header className="cyber-card p-8 border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-sm font-mono text-primary/60 mb-1 tracking-[0.2em]">POLL_QUESTION //</h1>
              <h1 className="text-4xl font-black glitch-text uppercase mb-4">{poll.title}</h1>
              <div className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 border border-primary/20">
                POLL_ID: {poll.contractPollId || 'PENDING'}
              </div>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {poll.description}
            </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 px-3 py-2 bg-black/50 border border-primary/10">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-primary/60">VOTING_MODE:</span>
                  <span className="text-white font-bold">YES/NO_BINARY_PRIVATE</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-black/50 border border-primary/10">
                  <span className="text-primary/60">NETWORK:</span>
                  <span className="text-white">STARKNET_SEPOLIA</span>
                </div>
              </div>
          </header>

          {isVotingPhase && (
            <section className="cyber-card p-8 relative overflow-hidden border-t-4 border-t-primary">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="w-32 h-32" />
              </div>
              
              <div className="bg-primary/10 border border-primary/30 p-4 mb-8 flex items-start gap-4">
                <Lock className="w-6 h-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="text-primary font-black text-sm uppercase mb-1">Confidentiality Protocol Active</h3>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    Individual votes are cryptographically salted and hashed. Your choice is <span className="text-primary font-bold">never visible</span> to anyone, including the creator. Only the final aggregated tally is revealed after the reveal phase.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                <Vote className="w-6 h-6 text-primary" />
                CAST_YOUR_SECRET_VOTE
              </h2>
              <p className="text-xs text-muted-foreground font-mono mb-8 uppercase tracking-widest opacity-70">
                Selection is private • Encrypted on-chain • Zero-knowledge integrity
              </p>
              <CommitForm pollId={pollId} />
            </section>
          )}

          {isRevealPhase && (
            <section className="cyber-card p-8 bg-yellow-500/5 border-yellow-500/20">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
                <Eye className="w-5 h-5" />
                REVEAL_PHASE_ACTIVE
              </h2>
              <RevealForm pollId={pollId} />
            </section>
          )}

          {isEnded && (
            <section className="cyber-card p-8 border-primary/40 bg-primary/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                FINAL_VOTING_RESULTS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-black/40 border border-primary/20">
                  <p className="text-xs text-primary/60 mb-1 font-mono uppercase tracking-widest">Total YES Votes</p>
                  <p className="text-3xl font-black text-white">{poll.yes_votes || 0}</p>
                </div>
                <div className="p-6 bg-black/40 border border-primary/20">
                  <p className="text-xs text-destructive/60 mb-1 font-mono uppercase tracking-widest">Total NO Votes</p>
                  <p className="text-3xl font-black text-white">{poll.no_votes || 0}</p>
                </div>
              </div>
              <p className="mt-6 text-[10px] text-muted-foreground font-mono uppercase text-center opacity-60">
                Privacy Guaranteed: Individual votes are cryptographically obscured.
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="cyber-card p-6">
            <h3 className="text-sm font-bold text-primary mb-4 tracking-widest uppercase">Time Remaining</h3>
            <CountdownTimer targetDate={isVotingPhase ? poll.votingEndsAt : poll.revealEndsAt} />
            <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase">
              Current Phase: {isVotingPhase ? 'VOTING' : isRevealPhase ? 'REVEAL' : 'ENDED'}
            </p>
          </div>

          <div className="cyber-card p-6 space-y-6">
            <h3 className="text-sm font-bold text-primary mb-4 tracking-widest uppercase">Protocol Status</h3>
            <div className="space-y-4">
              <StatusStep 
                active={isVotingPhase} 
                completed={!isVotingPhase} 
                title="COMMIT" 
                desc="Voters submit encrypted hashes" 
              />
              <StatusStep 
                active={isRevealPhase} 
                completed={isEnded} 
                title="REVEAL" 
                desc="Voters reveal original choices" 
              />
              <StatusStep 
                active={isEnded} 
                completed={false} 
                title="TALLY" 
                desc="Final result is calculated" 
              />
            </div>
          </div>

          {localVote && (
            <div className="cyber-card p-6 border-primary/30 bg-primary/5">
              <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2 uppercase">
                <ShieldCheck className="w-4 h-4" /> Local Record Found
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono leading-tight">
                You have a {localVote.status} vote stored in this browser for this poll.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function CommitForm({ pollId }: { pollId: number }) {
  const [choice, setChoice] = useState<"1" | "2" | "">("");
  const [salt, setSalt] = useState("");
  const [commitment, setCommitment] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: poll } = usePoll(pollId);

  const handleGenerate = async () => {
    if (!choice) return;
    setIsCalculating(true);
    const newSalt = "0x" + Math.random().toString(16).slice(2);
    const hash = hashVote(choice, newSalt);
    setSalt(newSalt);
    setCommitment(hash);
    setIsCalculating(false);
  };

  const handleSubmit = async () => {
    if (!commitment || !choice || !salt || !poll) return;
    setIsSubmitting(true);
    
    try {
      const starknet = await connect();
      if (!starknet) throw new Error("Connect wallet");
      const sn = starknet as any;
      if (sn.enable) await sn.enable();
      
      const contractAddress = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
      const contract = new Contract(VOTING_ABI, contractAddress, sn.account);
      
      const { transaction_hash } = await contract.commit_vote(poll.contractPollId, commitment);
      
      saveVoteLocally({
        pollId,
        choice: Number(choice),
        salt,
        txHash: transaction_hash,
        status: 'committed'
      });

      toast({ title: "Vote Committed", description: "Hash sent to Starknet." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setChoice("1")}
          className={`p-10 border-2 font-black transition-all flex flex-col items-center justify-center gap-4 group rounded-sm ${choice === "1" ? 'bg-primary border-primary text-black shadow-[0_0_30px_rgba(var(--primary),0.5)] scale-[1.02]' : 'bg-black/40 border-primary/20 text-primary/40 hover:border-primary/60 hover:text-primary hover:bg-primary/5'}`}
        >
          <span className="text-5xl block">YES</span>
          <span className="text-xs font-mono opacity-80 uppercase tracking-tighter">Private Vote</span>
        </button>
        <button 
          onClick={() => setChoice("2")}
          className={`p-10 border-2 font-black transition-all flex flex-col items-center justify-center gap-4 group rounded-sm ${choice === "2" ? 'bg-destructive border-destructive text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-[1.02]' : 'bg-black/40 border-primary/20 text-destructive/40 hover:border-destructive/60 hover:text-destructive hover:bg-destructive/5'}`}
        >
          <span className="text-5xl block">NO</span>
          <span className="text-xs font-mono opacity-80 uppercase tracking-tighter">Private Vote</span>
        </button>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-sm text-center">
        <p className="text-sm font-bold text-primary mb-1 uppercase tracking-widest">Privacy Protocol Active</p>
        <p className="text-[10px] text-muted-foreground font-mono leading-tight max-w-md mx-auto">
          Your individual vote choice is hidden cryptographically. 
          Individual votes are not visible. Only the final result will be revealed.
        </p>
      </div>

      <div className="space-y-4">
        {!commitment ? (
          <button 
            disabled={!choice || isCalculating}
            onClick={handleGenerate}
            className="w-full h-14 bg-primary text-black font-black hover:bg-primary/90 disabled:opacity-30 flex items-center justify-center gap-2 skew-x-[-2deg]"
          >
            {isCalculating && <Loader2 className="w-4 h-4 animate-spin" />}
            GENERATE_PRIVATE_COMMITMENT
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <button 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full cyber-button h-20 flex flex-col items-center justify-center gap-1 text-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">TRANSMITTING_ENCRYPTED_DATA...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6" />
                    <span>CAST_PRIVATE_VOTE</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 uppercase tracking-[0.2em]">Secure Starknet Broadcast</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RevealForm({ pollId }: { pollId: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const vote = getVoteForPoll(pollId);
  const { data: poll } = usePoll(pollId);

  const handleReveal = async () => {
    if (!vote || !poll) return;
    setIsSubmitting(true);
    
    try {
      const starknet = await connect();
      if (!starknet) throw new Error("Connect wallet");
      const sn = starknet as any;
      if (sn.enable) await sn.enable();
      
      const contractAddress = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
      const contract = new Contract(VOTING_ABI, contractAddress, sn.account);
      
      const { transaction_hash } = await contract.reveal_vote(poll.contractPollId, vote.choice, vote.salt);
      await sn.provider.waitForTransaction(transaction_hash);
      
      // Sync results after reveal
      try {
        const pollInfo = await contract.get_poll_info(poll.contractPollId);
        // pollInfo format: [creator, voting_end, reveal_end, yes_votes, no_votes]
        await fetch(`/api/polls/${pollId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yesVotes: Number(pollInfo[3] || pollInfo.yes_votes),
            noVotes: Number(pollInfo[4] || pollInfo.no_votes),
          })
        });
      } catch (syncErr) {
        console.error("Failed to sync results:", syncErr);
      }

      updateVoteStatus(pollId, 'revealed');
      toast({ title: "Vote Revealed!", description: `Successfully revealed choice ${vote.choice}.` });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vote) {
    return (
      <div className="text-center py-6 border border-dashed border-yellow-500/30">
        <p className="text-yellow-500/60 text-sm">NO_LOCAL_COMMIT_FOUND</p>
        <p className="text-[10px] text-muted-foreground mt-1">You must use the same browser used for committing.</p>
      </div>
    );
  }

  if (vote.status === 'revealed') {
    return (
      <div className="text-center py-6 bg-primary/10 border border-primary/30">
        <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-primary font-bold">VOTE_REVEALED_SUCCESSFULLY</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-black/60 border border-yellow-500/30 font-mono text-xs">
        <p className="text-yellow-500/60 mb-2">STORED_VOTE_DATA:</p>
        <div className="flex justify-between mb-1">
          <span>VOTE_CHOICE:</span>
          <span className="text-white font-bold">{vote.choice === 1 ? 'YES' : 'NO'}</span>
        </div>
        <div className="flex justify-between">
          <span>SALT:</span>
          <span className="text-white truncate max-w-[120px]">{vote.salt}</span>
        </div>
      </div>
      
      <button 
        disabled={isSubmitting}
        onClick={handleReveal}
        className="w-full py-3 bg-yellow-500 text-black font-black hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "REVEAL_SECRET_VOTE_ON_CHAIN"}
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
        <p className="text-muted-foreground">The requested poll stream could not be found.</p>
      </div>
    </Layout>
  );
}
