// Every catalog component's gallery entry. /dev/gallery renders this list and
// scripts/check-catalog.mjs fails CI when a component folder is missing here.
import type { GalleryEntry } from './galleryTypes';
import { gallery as mapGallery } from './map/gallery';
import { gallery as BalanceCard } from './metro/BalanceCard/gallery';
import { gallery as CoachCrowdBar } from './metro/CoachCrowdBar/gallery';
import { gallery as ConnectionPill } from './metro/ConnectionPill/gallery';
import { gallery as DepartureRow } from './metro/DepartureRow/gallery';
import { gallery as EmptyState } from './metro/EmptyState/gallery';
import { gallery as GateSelector } from './metro/GateSelector/gallery';
import { gallery as LineDiagram } from './metro/LineDiagram/gallery';
import { gallery as PlatformGroup } from './metro/PlatformGroup/gallery';
import { gallery as RideBanner } from './metro/RideBanner/gallery';
import { gallery as RouteSteps } from './metro/RouteSteps/gallery';
import { gallery as ScreenHeader } from './metro/ScreenHeader/gallery';
import { gallery as StationHeader } from './metro/StationHeader/gallery';
import { gallery as StationSection } from './metro/StationSection/gallery';
import { gallery as SummaryCard } from './metro/SummaryCard/gallery';
import { gallery as TabBar } from './metro/TabBar/gallery';
import { gallery as TrainCard } from './metro/TrainCard/gallery';
import { gallery as TrainIllustration } from './metro/TrainIllustration/gallery';
import { gallery as TransactionRow } from './metro/TransactionRow/gallery';
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
import { gallery as Text } from './ui/Text/gallery';

export const galleryRegistry: GalleryEntry[] = [
  Text, Icon, Stack, Button, IconButton, Chip, StatusBadge, Card, ListRow, IconTile, SectionLabel, Segmented, InfoNote, SwitchRow, Sheet, Layout,
  TabBar, ScreenHeader, StationHeader, DepartureRow, PlatformGroup, TrainCard, CoachCrowdBar, LineDiagram, GateSelector, RouteSteps,
  TransactionRow, BalanceCard, SummaryCard, RideBanner, ConnectionPill, TrainIllustration, EmptyState, StationSection,
  mapGallery,
];
