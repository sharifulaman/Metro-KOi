import type { LiveStage } from '@/data/demoLive';

export interface LiveTrainRow {
  id: string;
  title: string;
  sub: string;
  eta: string;
  live: boolean;
  badge: string;
}

export interface LiveGroupRow {
  big: string;
  small: string;
  live: boolean;
  badge: string;
}

export interface LiveViewText {
  langLabel: string;
  brandSub: string;
  search: string;
  counts: string;
  ride: string;
  credit: string;
  zoom: Record<LiveStage, string>;
  /** station names by id, in the current language */
  names: Record<string, string>;
  /** floating train tags: "SB-0630 · লাইভ" */
  tags: Record<'live' | 'estimated' | 'atStation', (id: string) => string>;
  // overview sheet
  runningTitle: string;
  trainsCount: string;
  rows: LiveTrainRow[];
  // city sheet
  cityPlatform: string;
  cityTrainId: string;
  cityEta: string;
  cityBadge: string;
  cityFrom: string;
  cityNext: string;
  trainDetail: string;
  // station sheet
  back: string;
  stationName: string;
  stationSub: string;
  trainAtStation: string;
  platformStrong: string;
  platformRest: string;
  chips: { label: string; tone: 'brand' | 'neutral' }[];
  groups: { title: string; rows: LiveGroupRow[] }[];
  open3d: string;
  gates: string;
}

export interface LiveViewProps {
  stage: LiveStage;
  onStage(stage: LiveStage): void;
  text: LiveViewText;
  /** 0..1 of the way along the segment, for the city-sheet progress bar */
  progress?: number;
  onSearch(): void;
  onLang(): void;
  onRide?(): void;
  onOpen3d(): void;
  onTrainDetail(): void;
  onGates(): void;
  onFavourite?(): void;
  testID?: string;
}
