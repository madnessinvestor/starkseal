import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto bg-black border border-primary/20 shadow-[0_0_20px_rgba(38,217,98,0.1)]">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-24 w-24 text-primary animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">404</h1>
            <h2 className="text-xl font-mono text-primary">SIGNAL_LOST</h2>
            <p className="text-sm text-muted-foreground font-mono">
              The requested neural pathway does not exist.
            </p>
          </div>

          <Link href="/">
            <button className="cyber-button w-full">
              RETURN_TO_BASE
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
