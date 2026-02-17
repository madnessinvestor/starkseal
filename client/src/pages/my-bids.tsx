import { Layout } from "@/components/layout";
import { getLocalBids, BidLocalData } from "@/lib/starknet-mock";
import { Link } from "wouter";
import { ExternalLink, Hash, Clock } from "lucide-react";

export default function MyBids() {
  const bids = getLocalBids();

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2 glitch-text">MY_COMMITS</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Local encrypted bid storage. Don't clear your browser cache.
        </p>
      </header>

      {bids.length === 0 ? (
        <div className="cyber-card p-12 text-center border-dashed">
          <p className="text-muted-foreground mb-4">No locally stored bids found.</p>
          <Link href="/">
            <button className="cyber-button text-sm">BROWSE AUCTIONS</button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bids.map((bid, i) => (
            <BidCard key={i} bid={bid} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function BidCard({ bid }: { bid: BidLocalData }) {
  return (
    <div className="cyber-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/60 transition-colors">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            bid.status === 'revealed' ? 'border-primary text-primary bg-primary/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
          }`}>
            {bid.status === 'revealed' ? 'REVEALED' : 'COMMITTED'}
          </span>
          <h3 className="text-lg font-bold">Auction #{bid.auctionId}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary/50">Amount:</span>
            <span className="text-white">{bid.amount} ETH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/50">Salt:</span>
            <span className="text-white blur-[3px] group-hover:blur-none transition-all">{bid.salt}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Link href={`/auction/${bid.auctionId}`}>
          <button className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4">
            VIEW_AUCTION <ExternalLink className="w-3 h-3" />
          </button>
        </Link>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
          <Hash className="w-3 h-3" />
          {bid.txHash.substring(0, 10)}...
        </div>
      </div>
    </div>
  );
}
