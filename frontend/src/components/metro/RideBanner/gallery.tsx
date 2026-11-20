import type { GalleryEntry } from '../../galleryTypes';

import { RideBanner } from './index';

export const gallery: GalleryEntry = {
  name: 'RideBanner',
  layer: 'metro',
  variants: [
    { label: 'sharing (green)', render: () => <RideBanner title="শেয়ার হচ্ছে • মিরপুর-১০ → কাজীপাড়া" subtitle="১২ জন যাত্রীকে সাহায্য করছেন" onStop={() => undefined} stopLabel="বন্ধ" /> },
    { label: 'checking / offline (ash)', render: () => <RideBanner live={false} title="যাচাই হচ্ছে…" subtitle="১২ জন যাত্রীকে সাহায্য করছেন" onStop={() => undefined} stopLabel="বন্ধ" /> },
  ],
};
