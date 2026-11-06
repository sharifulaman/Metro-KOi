// Native NFC bridge for MRT Pass / Rapid Pass (FeliCa). The decoding lives in
// lib/felica.ts; this file only moves bytes between the card and the decoder.
// react-native-nfc-manager is a native module: it is missing in Expo Go and on
// web, so it is required lazily and the app falls back to history-only.
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { hexToBytes, readCard, type CardRead, type Transceive } from '@/lib/felica';

type NfcModule = typeof import('react-native-nfc-manager');

/**
 * Is the native side in this binary? Checked BEFORE requiring the library:
 * its module body throws when the native module is missing, and in dev Metro
 * reports that as a fatal red screen even inside a try/catch.
 */
function hasNativeModule(): boolean {
  try {
    const g = globalThis as { RN$Bridgeless?: boolean; __turboModuleProxy?: unknown };
    const turbo = g.RN$Bridgeless === true || g.__turboModuleProxy != null;
    return (turbo ? TurboModuleRegistry.get('NfcManager') : NativeModules.NfcManager) != null;
  } catch {
    return false;
  }
}

let cached: NfcModule | null | undefined;
function nfcModule(): NfcModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || !hasNativeModule()) return (cached = null); // web / Expo Go
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-nfc-manager') as NfcModule;
    cached = mod?.default ? mod : null;
  } catch {
    cached = null; // Expo Go: native module not in the binary
  }
  return cached;
}

export type NfcAvailability = 'no_module' | 'unsupported' | 'disabled' | 'ready';

let started = false;
async function ensureStarted(m: NfcModule) {
  if (!started) {
    await m.default.start();
    started = true;
  }
}

export async function nfcAvailability(): Promise<NfcAvailability> {
  const m = nfcModule();
  if (!m) return 'no_module';
  try {
    if (!(await m.default.isSupported())) return 'unsupported';
    await ensureStarted(m);
    if (Platform.OS === 'android' && !(await m.default.isEnabled())) return 'disabled';
    return 'ready';
  } catch {
    return 'unsupported';
  }
}

export function openNfcSettings() {
  void nfcModule()?.default.goToNfcSetting();
}

export class CardReadError extends Error {
  constructor(public code: 'cancelled' | 'too_fast' | 'not_felica' | 'no_module') {
    super(code);
  }
}

export interface ScanMessages {
  /** iOS NFC sheet text while waiting */
  prompt: string;
  /** iOS sheet text after a good read, e.g. "Balance ৳410" */
  success(r: CardRead): string;
  /** iOS sheet text for a failed read */
  error(code: CardReadError['code']): string;
}

/**
 * Wait for a card tap and read its 20 history blocks.
 * iOS shows the system NFC sheet; Android reads while the app is open.
 */
export async function scanCard(msg: ScanMessages): Promise<CardRead> {
  const m = nfcModule();
  if (!m) throw new CardReadError('no_module');
  const Nfc = m.default;
  const ios = Platform.OS === 'ios';
  await ensureStarted(m);
  try {
    try {
      await Nfc.requestTechnology(ios ? m.NfcTech.FelicaIOS : m.NfcTech.NfcF, { alertMessage: msg.prompt });
    } catch {
      throw new CardReadError('cancelled'); // user closed the sheet / scan cancelled
    }
    const tag = (await Nfc.getTag()) as { id?: string; idm?: string } | null;
    const idm = hexToBytes(String(tag?.idm ?? tag?.id ?? ''));
    if (idm.length !== 8) throw new CardReadError('not_felica');

    // Android NfcF frames carry the length byte both ways; iOS CoreNFC adds
    // and strips it itself, so drop it on send and put it back on receive.
    const transceive: Transceive = ios
      ? async (cmd) => {
          const r = await Nfc.sendFelicaCommandIOS(cmd.slice(1));
          return [r.length + 1, ...r];
        }
      : (cmd) => Nfc.transceive(cmd);

    let result: CardRead;
    try {
      result = await readCard(transceive, idm, 2000);
    } catch {
      throw new CardReadError('too_fast');
    }
    if (ios) await Nfc.setAlertMessageIOS(msg.success(result)).catch(() => {});
    return result;
  } catch (e) {
    if (ios && e instanceof CardReadError && e.code !== 'cancelled') await Nfc.invalidateSessionWithErrorIOS(msg.error(e.code)).catch(() => {});
    throw e;
  } finally {
    await Nfc.cancelTechnologyRequest().catch(() => {});
  }
}

export function cancelScan() {
  void nfcModule()?.default.cancelTechnologyRequest().catch(() => {});
}
