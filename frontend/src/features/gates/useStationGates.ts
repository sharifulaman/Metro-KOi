import { useMemo } from 'react';

import type { GateItem, GateSelectorProps, RouteStepItem } from '@/components/metro';
import gatesFile from '@/data/gates.json';
import { nearestGate } from '@/lib/geo';
import type { Gate, GateMode, Lang, Platform, StationGate } from '@/models';

type T = (key: string, opts?: Record<string, unknown>) => string;

const all = (gatesFile as { gates: StationGate[] }).gates;

/**
 * Gates A–D for a station. Shared by the Gates screen, the Inside-route
 * screen and the 3D panel (spec §10.8).
 */
export function useStationGates(stationId: string, userPos?: { lat: number; lng: number } | null) {
  return useMemo(() => {
    const gates = all.filter((g) => g.stationId === stationId);
    const recommended = userPos ? nearestGate(gates, userPos.lat, userPos.lng) : undefined;
    return { gates, recommended, surveyed: gates.some((g) => g.lat != null) };
  }, [stationId, userPos]);
}

export function toGateItems(gates: StationGate[], lang: Lang): GateItem[] {
  return gates.map((g) => ({
    gate: g.gate,
    corner: g.corner,
    landmark: (lang === 'bn' ? g.landmarkBn : g.landmarkEn) ?? undefined,
    hasLift: g.hasLift,
    hasEscalator: g.hasEscalator,
  }));
}

export function gateLabels(t: T): GateSelectorProps['labels'] {
  return {
    gate: (g) => t('gates.gate', { g }),
    corner: (c) => t(`gates.corner.${c}`),
    nearest: t('gates.nearest'),
    lift: t('gates.lift'),
    escalator: t('gates.escalator'),
    unknown: t('common.infoSoon'),
  };
}

/** Gate → concourse → ticket gate → platform (spec §18.3), or the reverse for exit. */
export function buildRouteSteps(mode: GateMode, gate: Gate, platform: Platform, towards: string, lang: Lang, t: T): RouteStepItem[] {
  const pn = lang === 'bn' ? (platform === 1 ? '১' : '২') : platform;
  if (mode === 'entry') {
    return [
      { n: 1, text: t('route.gate', { g: gate }), icon: 'gate' },
      { n: 2, text: t('route.toConcourse'), icon: 'lift' },
      { n: 3, text: t('route.tapCard'), icon: 'card' },
      { n: 4, text: t('route.toPlatform'), icon: 'lift' },
      { n: 5, text: t('route.platform', { n: pn, name: towards }), icon: 'train' },
    ];
  }
  return [
    { n: 1, text: t('route.exitPlatform', { n: pn }), icon: 'lift' },
    { n: 2, text: t('route.exitTap'), icon: 'card' },
    { n: 3, text: t('route.exitConcourse'), icon: 'lift' },
    { n: 4, text: t('route.exitGate', { g: gate }), icon: 'gate' },
  ];
}
