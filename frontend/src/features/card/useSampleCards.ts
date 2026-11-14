import { useEffect } from 'react';

import { useT } from '@/i18n';
import { useWallet } from '@/store/wallet';

/** Until the rider saves a real card, fill the wallet with the design's sample cards (always labelled as samples). */
export function useSampleCards() {
  const { t } = useT();
  useEffect(() => {
    useWallet.getState().seedSamplesIfEmpty({ card: t('card.defaultCardName'), office: t('card.sampleOffice'), dad: t('card.sampleDad') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
