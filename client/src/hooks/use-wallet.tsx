import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { connect, disconnect } from "get-starknet";

interface WalletContextType {
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  status: "disconnected" | "connecting" | "connected";
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  const handleConnect = async (silent = false) => {
    try {
      if (!silent) setStatus("connecting");
      
      const starknet = await connect({
        modalMode: silent ? "neverAsk" : "canAsk",
      });

      if (starknet) {
        const sn = starknet as any;
        // For get-starknet v4, we might need to call enable
        if (!sn.isConnected && sn.enable) {
          await sn.enable();
        }
        
        if (sn.isConnected) {
          setAddress(sn.selectedAddress || null);
          setStatus("connected");
          return;
        }
      }
      
      if (!silent) setStatus("disconnected");
    } catch (err) {
      console.error("Wallet connection failed", err);
      if (!silent) setStatus("disconnected");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setAddress(null);
    setStatus("disconnected");
  };

  // Auto-connect on mount
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        const starknet = await connect({ modalMode: "neverAsk" });
        if (starknet && (starknet as any).isConnected) {
          setAddress((starknet as any).selectedAddress || null);
          setStatus("connected");
        }
      } catch (err) {
        console.error("Auto-connect failed", err);
      }
    };
    tryAutoConnect();
  }, []);

  return (
    <WalletContext.Provider value={{ address, connectWallet: () => handleConnect(), disconnectWallet: handleDisconnect, status }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
