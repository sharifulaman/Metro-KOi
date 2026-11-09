import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { NfcSupport } from '@/models';

import { nfcAvailability, type NfcAvailability } from './nfcReader';

export interface NfcStatus {
  /** feature gate (spec §18.4): 'balance' when the card can be read */
  support: NfcSupport;
  /** finer state for the Card screen */
  availability: NfcAvailability | 'checking';
  refresh(): void;
}

/**
 * NFC gate. 'balance' on a dev/production build with NFC hardware;
 * 'history_only' in Expo Go / web (no native module); 'unsupported' on
 * phones without NFC. Re-checked when the app returns to the foreground,
 * so turning NFC on in Settings is picked up.
 */
export function useNfcStatus(): NfcStatus {
  const [availability, setAvailability] = useState<NfcAvailability | 'checking'>('checking');
  const refresh = useCallback(() => {
    void nfcAvailability().then(setAvailability);
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  const support: NfcSupport =
    availability === 'checking' ? 'unknown' : availability === 'no_module' ? 'history_only' : availability === 'unsupported' ? 'unsupported' : 'balance';
  return { support, availability, refresh };
}

export function useNfcSupport(): NfcSupport {
  return useNfcStatus().support;
}
