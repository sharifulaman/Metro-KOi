// Every catalog component's gallery entry. /dev/gallery renders this list and
// scripts/check-catalog.mjs fails CI when a component folder is missing here.
import type { GalleryEntry } from './galleryTypes';
import { gallery as mapGallery } from './map/gallery';
import { gallery as BalanceCard } from './metro/BalanceCard/gallery';
import { gallery as BalancePanel } from './metro/BalancePanel/gallery';
import { gallery as CardArt } from './metro/CardArt/gallery';
import { gallery as NavHeader } from './metro/NavHeader/gallery';
import { gallery as LiveView } from './metro/LiveView/gallery';
import { gallery as StationDetailView } from './metro/StationDetailView/gallery';
import { gallery as StationsView } from './metro/StationsView/gallery';
import { gallery as ScanView } from './metro/ScanView/gallery';
import { gallery as FoundView } from './metro/FoundView/gallery';
import { gallery as AddCardSheet } from './metro/AddCardSheet/gallery';
import { gallery as ManualCardView } from './metro/ManualCardView/gallery';
import { gallery as SavedCardsView } from './metro/SavedCardsView/gallery';
import { gallery as HistoryView } from './metro/HistoryView/gallery';
import { gallery as CardColorPicker } from './metro/CardColorPicker/gallery';
import { gallery as CoachCrowdBar } from './metro/CoachCrowdBar/gallery';
import { gallery as ConnectionPill } from './metro/ConnectionPill/gallery';
import { gallery as DepartureRow } from './metro/DepartureRow/gallery';
import { gallery as EmptyState } from './metro/EmptyState/gallery';
import { gallery as GateSelector } from './metro/GateSelector/gallery';
import { gallery as LineDiagram } from './metro/LineDiagram/gallery';
import { gallery as PlatformGroup } from './metro/PlatformGroup/gallery';
import { gallery as RideBanner } from './metro/RideBanner/gallery';
import { gallery as RouteSteps } from './metro/RouteSteps/gallery';
import { gallery as SavedCardRow } from './metro/SavedCardRow/gallery';
import { gallery as ScreenHeader } from './metro/ScreenHeader/gallery';
import { gallery as StationHeader } from './metro/StationHeader/gallery';
import { gallery as StationSection } from './metro/StationSection/gallery';
import { gallery as SummaryCard } from './metro/SummaryCard/gallery';
import { gallery as TabBar } from './metro/TabBar/gallery';
import { gallery as TrainCard } from './metro/TrainCard/gallery';
import { gallery as TrainIllustration } from './metro/TrainIllustration/gallery';
import { gallery as TransactionRow } from './metro/TransactionRow/gallery';
import { gallery as JourneyOptionCard } from './metro/JourneyOptionCard/gallery';
import { gallery as JourneyPicker } from './metro/JourneyPicker/gallery';
import { gallery as JourneyDetailView } from './metro/JourneyDetailView/gallery';
import { gallery as JourneyView } from './metro/JourneyView/gallery';
import { gallery as NextTrainRow } from './metro/NextTrainRow/gallery';
import { gallery as PlaybackBar } from './metro/PlaybackBar/gallery';
import { gallery as SearchPill } from './metro/SearchPill/gallery';
import { gallery as SegmentProgress } from './metro/SegmentProgress/gallery';
import { gallery as BrandBar } from './metro/BrandBar/gallery';
import { gallery as BrandMark } from './metro/BrandMark/gallery';
import { gallery as MapLegend } from './metro/MapLegend/gallery';
import { gallery as Splash } from './metro/Splash/gallery';
import { gallery as TrainTimeline } from './metro/TrainTimeline/gallery';
import { gallery as WalletCarousel } from './metro/WalletCarousel/gallery';
import { gallery as WalletHome } from './metro/WalletHome/gallery';
import { gallery as StationTimeline } from './metro/StationTimeline/gallery';
import { gallery as NearestBanner } from './metro/NearestBanner/gallery';
import { gallery as GateFinderView } from './metro/GateFinderView/gallery';
import { gallery as GateCompassView } from './metro/GateCompassView/gallery';
import { gallery as DirectionEtaCard } from './metro/DirectionEtaCard/gallery';
import { gallery as InfoTile } from './metro/InfoTile/gallery';
import { gallery as Badge } from './ui/Badge/gallery';
import { gallery as Button } from './ui/Button/gallery';
import { gallery as Card } from './ui/Card/gallery';
import { gallery as Chip } from './ui/Chip/gallery';
import { gallery as Icon } from './ui/Icon/gallery';
import { gallery as IconButton } from './ui/IconButton/gallery';
import { gallery as IconTile } from './ui/IconTile/gallery';
import { gallery as InfoNote } from './ui/InfoNote/gallery';
import { gallery as Layout } from './ui/Layout/gallery';
import { gallery as ListRow } from './ui/ListRow/gallery';
import { gallery as SectionLabel } from './ui/SectionLabel/gallery';
import { gallery as Segmented } from './ui/Segmented/gallery';
import { gallery as Sheet } from './ui/Sheet/gallery';
import { gallery as Stack } from './ui/Stack/gallery';
import { gallery as StatusBadge } from './ui/StatusBadge/gallery';
import { gallery as SwitchRow } from './ui/SwitchRow/gallery';
import { gallery as TextField } from './ui/TextField/gallery';
import { gallery as GlassPill } from './ui/GlassPill/gallery';
import { gallery as Text } from './ui/Text/gallery';

export const galleryRegistry: GalleryEntry[] = [
  Text, Icon, Stack, Badge, Button, IconButton, Chip, StatusBadge, Card, ListRow, IconTile, SectionLabel, Segmented, InfoNote, SwitchRow, Sheet, Layout, TextField, GlassPill,
  TabBar, ScreenHeader, StationHeader, DepartureRow, PlatformGroup, TrainCard, CoachCrowdBar, LineDiagram, GateSelector, RouteSteps,
  TransactionRow, BalanceCard, SummaryCard, RideBanner, ConnectionPill, TrainIllustration, EmptyState, StationSection,
  SearchPill, NextTrainRow, PlaybackBar, SegmentProgress, TrainTimeline, JourneyPicker, JourneyOptionCard, JourneyDetailView, JourneyView, BrandMark, BrandBar, MapLegend, Splash,
  CardArt, LiveView, StationDetailView, StationsView, NavHeader, HistoryView, SavedCardsView, ManualCardView, AddCardSheet, FoundView, ScanView, CardColorPicker, WalletCarousel, WalletHome, BalancePanel, SavedCardRow, StationTimeline, NearestBanner, DirectionEtaCard, InfoTile, GateFinderView, GateCompassView,
  mapGallery,
];
