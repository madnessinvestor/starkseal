import { useAuctions } from "@/hooks/use-auctions";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Gavel, Clock, Lock, ArrowRight, Activity } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: auctions, isLoading } = useAuctions();

  return (
    <Layout>
      <header className="mb-12 border-b border-primary/20 pb-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="flex-shrink-0">
          <img src="/static/starknet-logo.png" className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_20px_rgba(138,92,246,0.3)]" alt="StarkSeal Large Logo" />
        </div>
        <div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 glitch-text">
            SECURE_AUCTIONS
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Deploy sealed-bid auctions on Starknet. Prevent front-running with cryptographic commitments. 
            Your bid remains a secret until the reveal phase.
          </p>
        </div>
      </header>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          ACTIVE_CONTRACTS
        </h2>
        <Link href="/create">
          <button className="cyber-button text-sm">
            + DEPLOY_NEW_AUCTION
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-secondary/30 rounded border border-primary/10 animate-pulse"></div>
          ))}
        </div>
      ) : auctions?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-primary/30 rounded-lg">
          <Gavel className="w-16 h-16 text-primary/20 mx-auto mb-4" />
          <h3 className="text-xl text-muted-foreground">NO_ACTIVE_AUCTIONS</h3>
          <p className="text-sm text-muted-foreground/60 mt-2">Be the first to initialize a contract.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions?.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function AuctionCard({ auction }: { auction: any }) {
  const isCommitPhase = new Date() < new Date(auction.biddingEndsAt);
  const isRevealPhase = !isCommitPhase && new Date() < new Date(auction.revealEndsAt);
  const isEnded = new Date() > new Date(auction.revealEndsAt);

  let statusColor = "text-muted-foreground";
  let statusText = "UNKNOWN";

  if (isCommitPhase) {
    statusColor = "text-primary";
    statusText = "COMMIT_OPEN";
  } else if (isRevealPhase) {
    statusColor = "text-yellow-500";
    statusText = "REVEAL_OPEN";
  } else if (isEnded) {
    statusColor = "text-destructive";
    statusText = "ENDED";
  }

  return (
    <Link href={`/auction/${auction.id}`}>
      <div className="cyber-card p-6 h-full flex flex-col cursor-pointer group hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className={`text-xs font-bold border px-2 py-0.5 rounded-full ${
            isCommitPhase ? 'border-primary text-primary bg-primary/10' :
            isRevealPhase ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
            'border-destructive text-destructive bg-destructive/10'
          }`}>
            {statusText}
          </div>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {auction.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-2">
          {auction.description}
        </p>

        <div className="space-y-2 text-xs font-mono text-muted-foreground border-t border-primary/10 pt-4">
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> COMMIT END:</span>
            <span className="text-foreground">{format(new Date(auction.biddingEndsAt), 'MM/dd HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Gavel className="w-3 h-3" /> REVEAL END:</span>
            <span className="text-foreground">{format(new Date(auction.revealEndsAt), 'MM/dd HH:mm')}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span>SELLER:</span>
            <span className="text-primary truncate max-w-[100px]">{auction.sellerAddress.substring(0, 6)}...{auction.sellerAddress.substring(60)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
