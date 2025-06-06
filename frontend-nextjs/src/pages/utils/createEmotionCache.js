// absensi_wajah_app/frontend-nextjs/utils/createEmotionCache.js
import createCache from '@emotion/cache';

export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}