import type { GalleryEntry } from '../../galleryTypes';

import { TransactionRow } from './index';

export const gallery: GalleryEntry = {
  name: 'TransactionRow',
  layer: 'metro',
  variants: [
    { label: 'trip (sample)', render: () => <TransactionRow kind="trip" title="মিরপুর-১০ → ফার্মগেট" time="সকাল ৮:৪২" amountBdt={30} sample sampleLabel="নমুনা তথ্য" divider /> },
    { label: 'recharge', render: () => <TransactionRow kind="recharge" title="রিচার্জ" time="গতকাল" amountBdt={500} /> },
  ],
};
