import { useState, useEffect } from "react";
import { formatDuration, intervalToDuration } from "date-fns";

export function CountdownTimer({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const distance = target - now;
      
      if (distance < 0) {
        setIsExpired(true);
        setTimeLeft(null);
      } else {
        setIsExpired(false);
        setTimeLeft(intervalToDuration({ start: now, end: target }));
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return <span className="text-destructive font-bold">EXPIRED</span>;
  }

  if (!timeLeft) return <span>CALCULATING...</span>;

  const pad = (n: number | undefined) => String(n || 0).padStart(2, '0');

  return (
    <div className="font-mono text-xl tracking-widest text-primary">
      {pad(timeLeft.days)}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
    </div>
  );
}
