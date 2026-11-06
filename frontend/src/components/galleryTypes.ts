import type { ReactNode } from 'react';

/** Every component folder exports one of these from gallery.tsx (spec §9.0 rule 4). */
export interface GalleryEntry {
  name: string;
  layer: 'ui' | 'metro' | 'map';
  variants: { label: string; render: () => ReactNode }[];
}
