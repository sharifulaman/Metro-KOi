import { useEffect, useState } from 'react';

/**
 * The real time of day, re-rendered every `intervalMs` (countdowns tick every second, spec §10.4).
 * Always the phone's clock, so every schedule and ETA on screen matches the real time (Dhaka time is
 * derived from it in `dhakaClock`).
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
