import * as React from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Shield, Gavel, Cpu, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { address, connectWallet, disconnectWallet, status } = useWallet();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 z-50"></div>
      <div className="scanline"></div>

      {/* Navigation */}
      <nav className="border-b border-primary/20 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <Shield className="w-8 h-8 text-primary group-hover:animate-pulse" />
              <span className="text-xl font-bold tracking-widest text-white group-hover:text-primary transition-colors">
                STARK<span className="text-primary">VOTE</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" active={location === "/"}>DASHBOARD</NavLink>
            <NavLink href="/create" active={location === "/create"}>INIT_POLL</NavLink>
            <NavLink href="/my-votes" active={location === "/my-votes"}>MY_COMMITS</NavLink>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-primary/60 hidden sm:block">
              NET: <span className="text-primary font-bold">STARKNET_SEPOLIA</span>
            </div>
            
            {address ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectWallet}
                className="border-primary/50 text-primary hover:bg-primary/10 text-xs"
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={connectWallet}
                disabled={status === "connecting"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {status === "connecting" ? "CONNECTING..." : "CONNECT_WALLET"}
              </Button>
            )}
            
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-black/90 py-6 mt-12">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>SYSTEM_STATUS: ONLINE</span>
          </div>
          <p>STARKVOTE v0.1.0 // ZK-POWERED PRIVACY</p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span className={`
        cursor-pointer text-sm font-bold tracking-wider px-2 py-1 relative
        transition-all duration-200
        ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
      `}>
        {active && <span className="absolute -left-2 top-1 text-primary animate-pulse">{'>'}</span>}
        {children}
      </span>
    </Link>
  );
}
