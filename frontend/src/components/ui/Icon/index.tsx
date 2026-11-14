import {
  Accessibility,
  ArrowRight,
  ArrowUpDown,
  ArrowUpFromLine,
  ArrowUpRight,
  Bell,
  Box,
  Building,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CirclePlus,
  CircleStop,
  Clock,
  Compass,
  CreditCard,
  DoorOpen,
  Footprints,
  Globe,
  Info,
  Layers,
  LayoutGrid,
  List,
  LocateFixed,
  Lock,
  Map as MapIcon,
  MapPin,
  MapPinOff,
  Moon,
  Nfc,
  PenLine,
  PersonStanding,
  Plus,
  Radio,
  Receipt,
  ReceiptText,
  Route,
  ScanLine,
  Search,
  Settings,
  Share2,
  Shield,
  Smartphone,
  ShieldCheck,
  Star,
  Sun,
  Ticket,
  TrainFront,
  Trash2,
  TriangleAlert,
  Users,
  Wallet,
  WifiOff,
  X,
  Play,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react-native';

import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import type { IconName, IconProps } from './types';

type GlyphProps = { size?: number | string; color?: string; strokeWidth?: number | string };

/** The design's own metro-train glyph (rounded body with two legs). */
const MetroGlyph = ({ size = 20, color = '#000', strokeWidth = 2 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="3" width="14" height="14" rx="3" />
    <Path d="M5 11h14M9 21l2-4M15 21l-2-4" />
  </Svg>
);

/** The design's contactless mark (four arcs). */
const ContactlessGlyph = ({ size = 20, color = '#000', strokeWidth = 2 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
    <Path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
    <Path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
    <Path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
  </Svg>
);

const MAP: Record<IconName, LucideIcon> = {
  train: MetroGlyph as unknown as LucideIcon,
  map: MapIcon,
  list: List,
  route: Route,
  card: CreditCard,
  more: LayoutGrid,
  search: Search,
  star: Star,
  back: ChevronLeft,
  chevron: ChevronRight,
  swap: ArrowUpDown,
  locate: LocateFixed,
  compass: Compass,
  box: Box,
  gate: DoorOpen,
  walk: Footprints,
  info: Info,
  shield: ShieldCheck,
  bell: Bell,
  globe: Globe,
  moon: Moon,
  sun: Sun,
  history: ReceiptText,
  wallet: Wallet,
  nfc: ContactlessGlyph as unknown as LucideIcon,
  live: Radio,
  clock: Clock,
  users: Users,
  arrowRight: ArrowRight,
  layers: Layers,
  close: X,
  stop: CircleStop,
  share: Share2,
  trash: Trash2,
  offline: WifiOff,
  gpsOff: MapPinOff,
  calendar: Calendar,
  building: Building,
  lift: ArrowUpFromLine,
  scan: ScanLine,
  settings: Settings,
  ticket: Ticket,
  receipt: Receipt,
  dot: CircleDot,
  accessibility: Accessibility,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  play: Play,
  add: Plus,
  edit: PenLine,
  check: Check,
  pin: MapPin,
  lock: Lock,
  person: PersonStanding,
  grid: LayoutGrid,
  warning: TriangleAlert,
  circlePlus: CirclePlus,
  phone: Smartphone,
  arrowUpRight: ArrowUpRight,
  metro: MetroGlyph as unknown as LucideIcon,
  contactless: ContactlessGlyph as unknown as LucideIcon,
  shieldPlain: Shield,
};

export function Icon({ name, size = 20, tone = 'ink', color, strokeWidth = 2, testID }: IconProps) {
  const { c } = useTheme();
  const toneColor: Record<NonNullable<IconProps['tone']>, string> = {
    ink: c.ink,
    muted: c.inkMuted,
    brand: c.brand,
    danger: c.danger,
    inverse: c.inverse,
    onBrand: c.onBrand,
    live: c.live,
    estimated: c.estimated,
    outline: c.outline,
  };
  const Cmp = MAP[name];
  return <Cmp size={size} color={color ?? toneColor[tone]} strokeWidth={strokeWidth} testID={testID} />;
}

export type { IconName, IconProps } from './types';
