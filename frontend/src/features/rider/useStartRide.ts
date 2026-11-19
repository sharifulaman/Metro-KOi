import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useT } from '@/i18n';
import { openAppSettings, showAlert } from '@/lib/alert';
import { useRider } from '@/store/rider';

import { useRiderSession, type RideOptions } from './useRiderSession';

/**
 * "I'm on this train": starts the ride at once (location is already allowed from the first launch) and lands
 * on Journey. No explainer page: if the rider is not near the metro line, or location is off, a short message
 * says so instead.
 */
export function useStartRide() {
  const rider = useRiderSession();
  const router = useRouter();
  const { t } = useT();
  return useCallback(
    async (opts: RideOptions = {}) => {
      const ok = await rider.start(opts);
      if (ok) {
        router.navigate('/journey');
        return;
      }
      const st = useRider.getState();
      showAlert(
        t('rider.cantLive'),
        st.permissionDenied ? t('rider.denied') : st.tooFar ? t('rider.tooFar') : t('rider.refused'),
        t('rider.ok'),
        st.permissionDenied ? { label: t('rider.openSettings'), onPress: openAppSettings } : undefined,
      );
    },
    [rider, router, t],
  );
}
