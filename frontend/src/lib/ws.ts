// Realtime client (spec §7.2): reconnect with exponential backoff + jitter
// (1 → 2 → 4 … 30 s), hello on open, full snapshot on reconnect, and a small
// offline queue for rider fixes (max 20, dropped when older than 10 s).
import type { ClientMessage, ConnectionState, Lang, ServerMessage } from '../models';

export interface LiveClientOptions {
  url: string;
  deviceId: string;
  lang: Lang;
  onMessage(msg: ServerMessage): void;
  onState(state: ConnectionState): void;
}

const MAX_BACKOFF_MS = 30000;
const MAX_QUEUE = 20;
const MAX_FIX_AGE_MS = 10000;

export class LiveClient {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private queue: ClientMessage[] = [];

  constructor(private opts: LiveClientOptions) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.ws?.close();
    this.ws = null;
    this.opts.onState('offline');
  }

  setLang(lang: Lang): void {
    this.opts.lang = lang;
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return;
    }
    if (msg.t === 'rider.fix') {
      this.queue.push(msg);
      if (this.queue.length > MAX_QUEUE) this.queue.shift();
    }
  }

  private flush(): void {
    const now = Date.now();
    const pending = this.queue.filter((m) => m.t !== 'rider.fix' || now - m.ts <= MAX_FIX_AGE_MS);
    this.queue = [];
    pending.forEach((m) => this.send(m));
  }

  private connect(): void {
    if (this.stopped) return;
    this.opts.onState(this.attempt === 0 ? 'offline' : 'reconnecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      this.opts.onState('live');
      this.send({ t: 'hello', deviceId: this.opts.deviceId, v: 1, lang: this.opts.lang });
      this.flush();
    };
    ws.onmessage = (ev) => {
      try {
        this.opts.onMessage(JSON.parse(String(ev.data)) as ServerMessage);
      } catch {
        // ignore malformed frames
      }
    };
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      this.scheduleReconnect();
    };
    ws.onerror = () => ws.close();
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.opts.onState('reconnecting');
    const base = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.attempt);
    const delay = base / 2 + Math.random() * (base / 2);
    this.attempt++;
    this.timer = setTimeout(() => this.connect(), delay);
  }
}
