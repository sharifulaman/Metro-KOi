import type { GalleryEntry } from '../../galleryTypes';

import { LineDiagram } from './index';

const stations = ['Uttara North', 'Uttara Center', 'Pallabi', 'Mirpur-10', 'Kazipara', 'Agargaon', 'Farmgate', 'Motijheel'].map((label) => ({ id: label, label }));

export const gallery: GalleryEntry = {
  name: 'LineDiagram',
  layer: 'metro',
  variants: [
    { label: 'vertical + trains', render: () => <LineDiagram stations={stations} highlightStation="Farmgate" trains={[{ id: 'a', dir: 'SB', state: 'LIVE', pos: 3.5 }, { id: 'b', dir: 'NB', state: 'ESTIMATED', pos: 6.2 }]} /> },
    { label: 'horizontal ride range', render: () => <LineDiagram orientation="horizontal" stations={stations} range={[3, 6]} highlightStation="Kazipara" trains={[{ id: 'a', dir: 'SB', state: 'LIVE', pos: 4.4 }]} /> },
  ],
};
