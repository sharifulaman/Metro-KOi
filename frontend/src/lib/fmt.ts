// Number/time formatting with Bangla digits (spec §9.0 rule 6, §12 i18n).
import type { Lang, Source } from '../models';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function fmtNum(n: number | string, lang: Lang): string {
  const s = typeof n === 'number' ? String(n) : n;
  return lang === 'bn' ? toBnDigits(s) : s;
}

/** Period words for Bangla clock times. */
export function bnPeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return 'সকাল';
  if (hour >= 12 && hour < 15) return 'দুপুর';
  if (hour >= 15 && hour < 18) return 'বিকাল';
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা';
  return 'রাত';
}

/** Seconds after midnight → "সকাল ৬:৩০" / "6:30 AM". */
export function fmtClock(secOfDay: number, lang: Lang): string {
  const s = ((Math.floor(secOfDay) % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  if (lang === 'bn') return `${bnPeriod(h)} ${toBnDigits(`${h12}:${mm}`)}`;
  return `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "সকাল ৬:৩০ – ৭:১০" / "6:30 – 7:10 AM": the period word is shown once when both ends share it. */
export function fmtClockRange(fromSec: number, toSec: number, lang: Lang): string {
  const a = fmtClock(fromSec, lang);
  const b = fmtClock(toSec, lang);
  if (lang === 'bn') {
    const [pa] = a.split(' ');
    const [pb, tb] = b.split(' ');
    return pa === pb ? `${a} – ${tb}` : `${a} – ${b}`;
  }
  const [ta, sa] = a.split(' ');
  const [, sb] = b.split(' ');
  return sa === sb ? `${ta} – ${b}` : `${a} – ${b}`;
}

/** 24-hour "08:11" for band rows. */
export function fmtHHMM(hhmm: string, lang: Lang): string {
  return fmtNum(hhmm, lang);
}

/** "3 min" for live, "~3 min" for schedule (spec §6.5). */
export function fmtEta(sec: number, source: Source, lang: Lang): string {
  if (sec < 30) return lang === 'bn' ? 'এখন' : 'Now';
  const min = Math.round(sec / 60);
  const prefix = source === 'schedule' ? '~' : '';
  return lang === 'bn' ? `${prefix}${toBnDigits(String(min))} মিনিট` : `${prefix}${min} min`;
}

/** Like fmtEta, but a train an hour or more away shows its clock time ("সকাল ৬:৩০"). */
export function fmtEtaAt(sec: number, atSec: number | undefined, source: Source, lang: Lang): string {
  if (sec >= 3600 && atSec != null) return fmtClock(atSec, lang);
  return fmtEta(sec, source, lang);
}

/** Seconds → "0:14" countdown (rounded up so it never shows 0:00 while still waiting). */
export function fmtMmSs(sec: number, lang: Lang): string {
  const s = Math.max(0, Math.ceil(sec));
  return fmtNum(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, lang);
}

/** Speed m/s → "58 km/h". */
export function fmtSpeed(mps: number, lang: Lang): string {
  const k = Math.round(Math.abs(mps) * 3.6);
  return lang === 'bn' ? `${toBnDigits(String(k))} কিমি/ঘ` : `${k} km/h`;
}

export function fmtDuration(sec: number, lang: Lang): string {
  const min = Math.round(sec / 60);
  if (min < 60) return lang === 'bn' ? `${toBnDigits(String(min))} মিনিট` : `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return lang === 'bn' ? `${toBnDigits(String(h))} ঘ. ${toBnDigits(String(r))} মি.` : `${h} h ${r} min`;
}

export function fmtTaka(n: number, lang: Lang): string {
  return `৳${fmtNum(n.toLocaleString('en-US'), lang)}`;
}

export function fmtDistance(m: number, lang: Lang): string {
  if (m < 1000) return lang === 'bn' ? `${toBnDigits(String(Math.round(m)))} মি. দূরে` : `${Math.round(m)} m away`;
  const km = (m / 1000).toFixed(1);
  return lang === 'bn' ? `${toBnDigits(km)} কি.মি. দূরে` : `${km} km away`;
}

/** "850 m" / "2.8 km" without the "away" words, for tight rows. */
export function fmtDistanceShort(m: number, lang: Lang): string {
  if (m < 1000) return lang === 'bn' ? `${toBnDigits(String(Math.round(m)))} মি.` : `${Math.round(m)} m`;
  const km = (m / 1000).toFixed(1);
  return lang === 'bn' ? `${toBnDigits(km)} কি.মি.` : `${km} km`;
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Dhaka-local date "৬ নভেম্বর" / "6 Nov". */
export function fmtDate(ms: number, lang: Lang): string {
  const d = new Date(ms + 6 * 3600 * 1000);
  const day = d.getUTCDate();
  return lang === 'bn' ? `${toBnDigits(String(day))} ${BN_MONTHS[d.getUTCMonth()]}` : `${day} ${EN_MONTHS[d.getUTCMonth()]}`;
}

export function secOfDayFromMs(ms: number): number {
  const d = new Date(ms + 6 * 3600 * 1000);
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
}

/** "০৮:১২" / "08:12": 24-hour Dhaka time, as the design shows trip times. */
export function fmtHM(ms: number, lang: Lang): string {
  const sec = secOfDayFromMs(ms);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return fmtNum(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, lang);
}

/** "০৮:৪১:৩৮" / "08:41:38": 24-hour Dhaka time with seconds (train hints). */
export function fmtHMS(ms: number, lang: Lang): string {
  const sec = secOfDayFromMs(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return fmtNum(`${p(Math.floor(sec / 3600))}:${p(Math.floor((sec % 3600) / 60))}:${p(sec % 60)}`, lang);
}

/** "−৳ ৪০" / "+৳ ৫০০": a fare or recharge with its sign, as the design writes it. */
export function fmtTakaSigned(n: number, sign: '−' | '+', lang: Lang): string {
  return `${sign}৳ ${fmtNum(n.toLocaleString('en-US'), lang)}`;
}

/** Whole days between two instants on the Dhaka calendar (0 = same day). */
export function dayDiff(nowMs: number, thenMs: number): number {
  const day = (ms: number) => Math.floor((ms + 6 * 3600 * 1000) / 86400000);
  return day(nowMs) - day(thenMs);
}

