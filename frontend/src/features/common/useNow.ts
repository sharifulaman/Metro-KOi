import { useEffect, useState } from 'react';

import { simNow, useClock } from '@/store/clock';

/**
 * Re-render every `intervalMs` (countdowns tick every second, spec §10.4).
 * Returns the playback clock while timetable playback is on, so every
 * schedule-driven screen follows it; ticks faster when playback is sped up.
 */
export function useNow(intervalMs = 1000): number {
  const playback = useClock((s) => s.playback);
  const tick = playback && playback.rate > 1 ? Math.min(intervalMs, 250) : intervalMs;
  const [now, setNow] = useState(() => simNow(playback));
  useEffect(() => {
    setNow(simNow(playback));
    const id = setInterval(() => setNow(simNow(playback)), tick);
    return () => clearInterval(id);
  }, [tick, playback]);
  return now;
}
