import { useState, useEffect } from "react";
import { usePolls } from "@/hooks/use-polls";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Vote, Clock, Lock, ArrowRight, Activity } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: polls, isLoading } = usePolls();

  return (
    <Layout>
      <header className="mb-12 border-b border-primary/20 pb-8">
        <h1 className="text-4xl md:text-6xl font-black mb-4 glitch-text">
          SECURE_VOTING
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Deploy private polls on Starknet. Ensure vote confidentiality with cryptographic commitments. 
          Your vote remains a secret until the reveal phase.
        </p>
      </header>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          ACTIVE_POLLS
        </h2>
        <Link href="/create">
          <button className="cyber-button text-sm">
            + CREATE_NEW_POLL
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-secondary/30 rounded border border-primary/10 animate-pulse"></div>
          ))}
        </div>
      ) : polls?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-primary/30 rounded-lg">
          <Vote className="w-16 h-16 text-primary/20 mx-auto mb-4" />
          <h3 className="text-xl text-muted-foreground">NO_ACTIVE_POLLS</h3>
          <p className="text-sm text-muted-foreground/60 mt-2">Be the first to initialize a poll.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls?.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function PollCard({ poll }: { poll: any }) {
  const isVotingPhase = new Date() < new Date(poll.votingEndsAt);
  const isRevealPhase = !isVotingPhase && new Date() < new Date(poll.revealEndsAt);
  const isEnded = new Date() > new Date(poll.revealEndsAt);

  let statusText = "UNKNOWN";

  if (isVotingPhase) {
    statusText = "VOTING_OPEN";
  } else if (isRevealPhase) {
    statusText = "REVEAL_OPEN";
  } else if (isEnded) {
    statusText = "ENDED";
  }

  return (
    <Link href={`/poll/${poll.id}`}>
      <div className="cyber-card p-6 h-full flex flex-col cursor-pointer group hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className={`text-[10px] font-mono font-bold border px-2 py-0.5 uppercase tracking-tighter ${
            isVotingPhase ? 'border-primary text-primary bg-primary/10' :
            isRevealPhase ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
            'border-destructive text-destructive bg-destructive/10'
          }`}>
            {statusText}
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 border border-primary/20 rounded-sm">
            <Lock className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">PRIVATE</span>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {poll.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-2">
          {poll.description}
        </p>

        <div className="space-y-2 text-xs font-mono text-muted-foreground border-t border-primary/10 pt-4">
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> VOTING END:</span>
            <span className="text-foreground">{format(new Date(poll.votingEndsAt), 'MM/dd HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Vote className="w-3 h-3" /> REVEAL END:</span>
            <span className="text-foreground">{format(new Date(poll.revealEndsAt), 'MM/dd HH:mm')}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span>CREATOR:</span>
            <span className="text-primary truncate max-w-[100px]">{poll.creatorAddress.substring(0, 6)}...{poll.creatorAddress.substring(60)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
