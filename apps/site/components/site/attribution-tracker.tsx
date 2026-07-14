'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/attribution';

/** Captura a atribuição first-touch em toda visita (roda uma vez no cliente). */
export function AttributionTracker() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return null;
}
