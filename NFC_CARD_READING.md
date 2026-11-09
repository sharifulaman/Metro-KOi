# NFC Card Reading — MRT Pass / Rapid Pass

How Dhaka MRT Pass and Rapid Pass cards are scanned, encoded and decoded, based on the open-source
[mrt-buddy](https://github.com/aniruddha-adhikary/mrt-buddy) app (Kotlin Multiplatform), and how the same logic
maps onto Metro Koi (Expo / React Native).

> Status: implemented, not yet tested on a real card.
> Decoder: `frontend/src/lib/felica.ts` (tests: `src/lib/__tests__/felica.test.ts`).
> Native bridge: `src/features/card/nfcReader.ts` (react-native-nfc-manager).
> Scan hook: `src/features/card/useCardScan.ts`. Screens: `app/(tabs)/card.tsx`, `app/balance.tsx`.
> `useNfcSupport` returns `'balance'` on a dev/store build with NFC, and `'history_only'` in Expo Go / web.

---

## 1. What the card is

- MRT Pass and Rapid Pass are **Sony FeliCa** cards (NFC-F).
- Apps can only **read** them. Nothing is written to the card; topping up or changing the balance needs DMTCL's secret keys.
- The trip history is stored unencrypted: **service code `0x220F`, blocks 0–19** — the last ~20 transactions, newest first.
- "Encode" = building the FeliCa read command. "Decode" = turning the response bytes into a balance and trips.

## 2. Flow on each tap

```
tap card
  → OS detects an NFC-F tag → read IDm (8-byte card id)
  → send READ blocks 0–9   → decode frame → parse 10 blocks
  → send READ blocks 10–19 → decode frame → parse 10 blocks
  → drop invalid blocks (timestamp before 2020-01-01)
  → balance = transactions[0].balance
```

- The 20 blocks are read in two windows of 10, because one FeliCa read can't return all 20 at once.
- If the card is pulled away mid-read, keep what was already read (partial result).
- If nothing was read, show "Balance not found — you moved the card too fast."

mrt-buddy source: `nfc/FelicaReader.kt`

## 3. Encoding — the read command

Command: **Read Without Encryption** (`0x06`). mrt-buddy source: `nfc/NfcCommandGenerator.kt`

| Byte(s) | Value | Meaning |
|---|---|---|
| 0 | `14 + 2*N` | total command length |
| 1 | `0x06` | command code: Read Without Encryption |
| 2–9 | IDm | 8-byte card id from the tag |
| 10 | `0x01` | number of services |
| 11–12 | `0x0F 0x22` | service code `0x220F`, little-endian |
| 13 | `N` | number of blocks (10) |
| 14… | `0x80, blockNo` | one 2-byte entry per block: `80 00`, `80 01`, … |

```ts
function buildReadCommand(idm: number[], startBlock: number, n = 10): number[] {
  const blockList = Array.from({ length: n }, (_, i) => [0x80, startBlock + i]).flat();
  const len = 14 + blockList.length;
  return [len, 0x06, ...idm, 0x01, 0x0f, 0x22, n, ...blockList];
}
```

## 4. Decoding — the response frame

mrt-buddy source: `nfc/FelicaFrameDecoder.kt`

| Byte(s) | Meaning |
|---|---|
| 0 | length |
| 1 | response code (`0x07`) |
| 2–9 | IDm |
| 10 | status flag 1 — must be `0x00` |
| 11 | status flag 2 — must be `0x00` |
| 12 | number of blocks `N` |
| 13… | `N` × 16-byte blocks |

- If either status flag is not `0x00`, discard the whole window.
- If the frame is shorter than 13 bytes, or too short for `N` blocks, treat it as a failed read.
- **iOS** CoreNFC (`readWithoutEncryption`) returns `statusFlag1`, `statusFlag2` and a list of 16-byte blocks directly, so there is no frame to unpack. Both platforms should end up in one shape:

```ts
type FelicaReadResult = { status1: number; status2: number; blocks: Uint8Array[] };
```

## 5. Decoding — one 16-byte transaction block

mrt-buddy source: `nfc/parser/TransactionParser.kt`, `nfc/parser/ByteParser.kt`

| Byte(s) | Field | How to read it |
|---|---|---|
| 0–3 | fixed header (transaction type) | hex string, e.g. `08 52 10 00` |
| 4–6 | timestamp | 24-bit **big-endian** int, then unpack the bits (below) |
| 6–7 | transaction type bytes | hex string (stored, not otherwise used) |
| 8 | from-station code | 1 byte |
| 10 | to-station code | 1 byte |
| 11–13 | **balance (BDT)** | 24-bit **little-endian** int |
| 14–15 | trailing bytes | unused |

### Timestamp

mrt-buddy source: `nfc/service/TimestampService.kt`

```ts
const v = (b[4] << 16) | (b[5] << 8) | b[6];
const hour  = (v >> 3)  & 0x1f;
const day   = (v >> 8)  & 0x1f;   // fallback to 1 if not 1..31
const month = (v >> 13) & 0x0f;   // fallback to 1 if not 1..12
const year  = baseYear + ((v >> 17) & 0x1f);  // baseYear = current century, e.g. 2000
// minutes are NOT stored — times are hour precision only. Timezone: Asia/Dhaka.
```

Drop any transaction whose timestamp is not after **2020-01-01** (empty or garbage block).

### Balance

```ts
const balance = b[11] | (b[12] << 8) | (b[13] << 16);
```

### Transaction type (header bytes 0–3)

mrt-buddy source: `model/Transaction.kt`

| Header | Type |
|---|---|
| `08 52 10 00` | Metro trip (MRT & Rapid Pass) |
| `1D 60 02 01` | Recharge (MRT Pass) |
| `42 60 02 00` | Recharge (Rapid Pass) |
| `08 D2 20 00` | Hatirjheel bus — start |
| `42 D6 30 00` | Hatirjheel bus — end |
| anything else | Unknown |

### Station codes

mrt-buddy source: `nfc/service/StationService.kt`

| Code | Station | Metro Koi `stations.json` id |
|---|---|---|
| 10 | Motijheel | `motijheel` |
| 20 | Bangladesh Secretariat | `bangladesh-secretariat` |
| 25 | Dhaka University | `dhaka-university` |
| 30 | Shahbagh | `shahbagh` |
| 35 | Karwan Bazar | `karwan-bazar` |
| 40 | Farmgate | `farmgate` |
| 45 | Bijoy Sarani | `bijoy-sarani` |
| 50 | Agargaon | `agargaon` |
| 55 | Shewrapara | `shewrapara` |
| 60 | Kazipara | `kazipara` |
| 65 | Mirpur 10 | `mirpur-10` |
| 70 | Mirpur 11 | `mirpur-11` |
| 75 | Pallabi | `pallabi` |
| 80 | Uttara South | `uttara-south` |
| 85 | Uttara Center | `uttara-center` |
| 90 | Uttara North | `uttara-north` |

- Hatirjheel bus stops: 13 Mohanagar, 16 Rampura, 17 Badda, 19 Police Plaza, 28 FDC.
- Kamalapur has no known code yet. Show unknown codes as `Unknown (code)`.
- The ids in the third column are guesses based on the `stations.json` naming pattern. Check them against the file before using them.

### Fare amount

The card doesn't store the fare; it's the difference between consecutive balances (list is newest first):

```ts
amount[i] = tx[i].balance - tx[i + 1].balance;   // last entry: no amount
// negative → fare paid, positive → recharge
```

### Card type

The IDm starts with `01 27` → Rapid Pass; otherwise MRT Pass. mrt-buddy source: `utils/HeuristicsUtils.kt`

## 6. Platform requirements

### Android

- `AndroidManifest.xml`: `<uses-permission android:name="android.permission.NFC" />`
- Scan: `NfcAdapter.enableReaderMode(activity, callback, FLAG_READER_NFC_F, null)`
- Read: `NfcF.get(tag)`, then `connect()`, then `transceive(command)` per window, then `close()`
- Listen for `ACTION_ADAPTER_STATE_CHANGED` to tell when NFC is switched on or off.

### iOS

- Session: `NFCTagReaderSession(pollingOption: .iso18092)`. The system NFC sheet appears on every scan.
- Read: `tag.readWithoutEncryption(serviceCodeList: [0x0F22 as LE bytes], blockList: [[0x80, n], …])`
- `Info.plist`:
  - `NFCReaderUsageDescription` — e.g. "We need access to NFC to read your transit card"
  - `com.apple.developer.nfc.readersession.felica.systemcodes` = `["90E3"]`
- Entitlement: `com.apple.developer.nfc.readersession.formats` = `["TAG"]`

## 7. Card states (UI)

The same states mrt-buddy uses (`CardState`):

| State | When |
|---|---|
| `NoNfcSupport` | device has no NFC hardware |
| `NfcDisabled` | NFC is turned off (Android) |
| `WaitingForTap` | scanning, waiting for card |
| `Reading` | tag detected, reading blocks |
| `Balance(amount)` | read succeeded |
| `Error(message)` | read failed or card moved too fast |

## 8. Mapping to Metro Koi

| Piece | Where in Metro Koi |
|---|---|
| Native NFC | add `react-native-nfc-manager` and its config plugin in `frontend/app.json` (Android permission, iOS plist and entitlement). Needs an EAS dev build (`expo-dev-client` is already installed); Expo Go won't work. |
| Android read | `requestTechnology(NfcTech.NfcF)` → `tag.id` = IDm → `transceive(buildReadCommand(...))` → decode frame |
| iOS read | `requestTechnology(NfcTech.FelicaIOS)` → `felicaHandlerIOS.sendFelicaCommandIOS(...)`. Check how the length byte is handled; the response offset may differ from the Android frame. |
| Pure decoder | new `frontend/src/lib/felica.ts` with `buildReadCommand`, `decodeFrame`, `parseBlock`, `decodeTimestamp` and `withAmounts`. No hardware needed, so it can be tested with `node --test` like `schedule.test.ts`. |
| Station mapping | card code → `stations.json` id table (section 5) |
| Scan hook | new `frontend/src/features/card/useCardScan.ts` exposing the states in section 7 |
| Feature gate | `frontend/src/features/card/useNfcSupport.ts` → return `'balance'` when NFC is available (`NfcSupport` type in `models/card.ts`) |
| UI | `app/(tabs)/card.tsx`, `app/balance.tsx`, `app/history.tsx` using the existing `BalanceCard` and `TransactionRow` components |

## 9. Testing without a card

- Build fake 16-byte blocks and full frames in a fixtures file. mrt-buddy does this in `commonTest/.../nfc/FelicaFixtures.kt`.
- Run the decoder against them with a fake transceiver that returns those bytes, so status-flag handling, filtering and partial reads are all tested.
- Always pass an explicit `baseYear` in tests, because the default comes from the system clock.
- If you save a real card dump, **remove the IDm first** (bytes 2–9 of each frame).

## 10. Limitations

- Read-only: no top-up, no writing.
- Times are hour-level only (no minutes).
- Only the last ~20 transactions are on the card. Save every scan to build a longer history.
- Station codes for new stations (e.g. Kamalapur) are not known yet.
