import { makeMatcher } from '../web/src/shared/match.js';

// פריטים שאינם חדשות: קידום מכירות, מדורי שירות, תוכן אינטראקטיבי.
const JUNK_PATHS = ['/promotion', '/shopping', '/deals', '/horoscope', '/food/recipe',
                    '/astrology', 'sponsored', '/quiz', '/games', '/coupon'];

const matchJunkTitle = makeMatcher([
  'חידון', 'הורוסקופ', 'מזלות', 'מתכון', 'מתכונים', 'קופון', 'מבצעי', 'דילים',
  'בחסות', 'תוכן שיווקי', 'סקר קוראים', 'טריוויה', 'הגרלה'
]);

export function isNoise(item) {
  const link = (item.link || '').toLowerCase();
  if (JUNK_PATHS.some(p => link.includes(p))) return true;
  return matchJunkTitle(item.title).length > 0;
}
