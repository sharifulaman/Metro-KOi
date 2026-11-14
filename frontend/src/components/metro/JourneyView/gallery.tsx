import type { GalleryEntry } from '../../galleryTypes';

import { JourneyView } from './index';

const picker = { fromCaption: 'কোথা থেকে', toCaption: 'কোথায়', fromLabel: 'ফার্মগেট', toLabel: 'মতিঝিল', onFrom: () => {}, onTo: () => {}, onSwap: () => {}, swapLabel: 'অদলবদল' };

export const gallery: GalleryEntry = {
  name: 'JourneyView',
  layer: 'metro',
  variants: [
    {
      label: 'live (design ১৬)',
      render: () => (
        <JourneyView
          title="যাত্রা"
          subtitle="কোথা থেকে কোথায় যাবেন"
          timetableLabel="সময়সূচি"
          onTimetable={() => {}}
          picker={picker}
          modes={{ nowLabel: 'এখনই', laterLabel: 'পরে ছাড়বে', later: false, onNow: () => {}, onLater: () => {}, summary: 'মতিঝিলের দিকে · ~১২ মিনিট', laterOptions: [] }}
          best={{
            bestLabel: 'সবচেয়ে দ্রুত',
            badge: 'live',
            badgeLabel: 'লাইভ',
            departCaption: 'ছাড়বে',
            arriveCaption: 'পৌঁছাবে',
            depart: '৫:৪৮',
            arrive: '৬:০০',
            waitText: '৪ মিনিট পরে',
            arriveText: '৫টি স্টেশন',
            duration: '১২ মিনিট',
            midStops: 4,
            platformText: 'প্ল্যাটফর্ম ১ · মতিঝিলের দিকে',
            platformMeta: 'SB-0630',
            action: { label: 'ট্রেন ট্র্যাক করুন', icon: 'pin', onPress: () => {} },
            share: { label: 'শেয়ার', onPress: () => {} },
          }}
          listTitle="পরের ট্রেন"
          rows={[
            { badge: 'estimated', badgeLabel: 'আনুমানিক', depart: '৫:৫৮', arrive: '৬:১০', waitText: '১৪ মিনিট পরে' },
            { badge: 'estimated', badgeLabel: 'আনুমানিক', depart: '৬:০৮', arrive: '৬:২০', waitText: '২৪ মিনিট পরে' },
          ]}
          disclaimer="যাত্রার সময় অনুমান করা। অননুমোদিত অ্যাপ।"
        />
      ),
    },
    {
      label: 'service closed (design ১৮)',
      render: () => (
        <JourneyView
          title="যাত্রা"
          subtitle="কোথা থেকে কোথায় যাবেন"
          timetableLabel="সময়সূচি"
          onTimetable={() => {}}
          picker={picker}
          closedNote={{ title: 'আজকের সার্ভিস শেষ', body: 'কাল সকালের সময়সূচি দেখানো হচ্ছে। সরাসরি তথ্য নেই।' }}
          best={{
            bestLabel: 'কাল সকালের প্রথম ট্রেন',
            badge: 'schedule',
            badgeLabel: 'সময়সূচি',
            departCaption: 'ছাড়বে',
            arriveCaption: 'পৌঁছাবে',
            depart: '৬:৫৭',
            arrive: '৭:১০',
            waitText: 'কাল সকাল',
            arriveText: '৫টি স্টেশন',
            duration: '১৩ মিনিট',
            midStops: 4,
            platformText: 'প্ল্যাটফর্ম ১ · মতিঝিলের দিকে',
            platformMeta: 'সময়সূচি অনুযায়ী',
            action: { label: 'যাত্রার বিস্তারিত', icon: 'list', onPress: () => {} },
            share: { label: 'শেয়ার', onPress: () => {} },
          }}
          listTitle="এরপরের ট্রেন"
          rows={[{ badge: 'schedule', badgeLabel: 'সময়সূচি', depart: '৭:১৫', arrive: '৭:২৮', waitText: 'কাল সকাল' }]}
          disclaimer="যাত্রার সময় অনুমান করা। অননুমোদিত অ্যাপ।"
        />
      ),
    },
  ],
};
