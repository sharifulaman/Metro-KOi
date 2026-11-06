import type { GalleryEntry } from '../../galleryTypes';
import { IconTile } from '../IconTile';
import { Text } from '../Text';

import { ListRow } from './index';

export const gallery: GalleryEntry = {
  name: 'ListRow',
  layer: 'ui',
  variants: [
    {
      label: 'leading + trailing + divider',
      render: () => (
        <ListRow
          leading={<IconTile icon="train" />}
          title="মিরপুর-১০ → ফার্মগেট"
          subtitle="সকাল ৮:৪২"
          trailing={<Text numeric weight={600}>−৳৩০</Text>}
          divider
        />
      ),
    },
    { label: 'settings row chevron', render: () => <ListRow title="Privacy & data" leading={<IconTile icon="shield" tone="neutral" />} chevron onPress={() => undefined} /> },
    { label: 'highlighted (current band)', render: () => <ListRow title="08:11–10:00" subtitle="every 5 min" highlighted /> },
  ],
};
