import { Layout } from "@/components/layout";
import { getLocalVotes, VoteLocalData } from "@/lib/starknet-mock";
import { Link } from "wouter";
import { ExternalLink, Hash, Clock, Vote } from "lucide-react";

export default function MyVotes() {
  const votes = getLocalVotes();

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2 glitch-text">MY_VOTES</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Local encrypted vote storage. Don't clear your browser cache.
        </p>
      </header>

      {votes.length === 0 ? (
        <div className="cyber-card p-12 text-center border-dashed">
          <p className="text-muted-foreground mb-4">No locally stored votes found.</p>
          <Link href="/">
            <button className="cyber-button text-sm">BROWSE POLLS</button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {votes.map((vote, i) => (
            <VoteCard key={i} vote={vote} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function VoteCard({ vote }: { vote: VoteLocalData }) {
  return (
    <div className="cyber-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/60 transition-colors">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            vote.status === 'revealed' ? 'border-primary text-primary bg-primary/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
          }`}>
            {vote.status === 'revealed' ? 'REVEALED' : 'COMMITTED'}
          </span>
          <h3 className="text-lg font-bold">Poll #{vote.pollId}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary/50">Choice:</span>
            <span className="text-white">Option {vote.choice}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/50">Salt:</span>
            <span className="text-white blur-[3px] group-hover:blur-none transition-all">{vote.salt}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Link href={`/poll/${vote.pollId}`}>
          <button className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4">
            VIEW_POLL <ExternalLink className="w-3 h-3" />
          </button>
        </Link>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
          <Hash className="w-3 h-3" />
          {vote.txHash.substring(0, 10)}...
        </div>
      </div>
    </div>
  );
}
