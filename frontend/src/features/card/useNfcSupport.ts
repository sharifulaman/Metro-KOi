import type { NfcSupport } from '@/models';

/**
 * NFC feasibility gate (spec §18.4). Reading the MRT / Rapid Pass card balance
 * has not been confirmed with DTCA/DMTCL or a real card, so the app runs the
 * history-only path. Flip this after the feasibility test passes and
 * react-native-nfc-manager is added.
 */
export function useNfcSupport(): NfcSupport {
  return 'history_only';
}
