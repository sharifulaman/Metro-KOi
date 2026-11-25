import { Stack as RouteStack, useRouter } from 'expo-router';

import { AddCardSheet } from '@/components/metro';
import { useT } from '@/i18n';
import { goBack } from '@/lib/nav';

/** How to save a card (design ৫): a sheet over the Card page — tap it to the phone, or type a name and last 4 digits. */
export default function CardAddScreen() {
  const { t } = useT();
  const router = useRouter();
  return (
    <>
      <RouteStack.Screen options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', headerShown: false }} />
      <AddCardSheet
        title={t('card.chooseHowTitle')}
        subtitle={t('card.chooseHowBody')}
        scanTitle={t('card.scanOptionTitle')}
        scanBadge={t('card.scanOptionEasy')}
        scanBody={t('card.scanOptionBody')}
        manualTitle={t('card.manualOptionTitle')}
        manualBody={t('card.manualOptionBody')}
        cancelLabel={t('common.cancel')}
        onScan={() => router.replace('/card/scan')}
        onManual={() => router.replace('/card/manual')}
        onCancel={() => goBack()}
        testID="add-sheet"
      />
    </>
  );
}
