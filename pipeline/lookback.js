// מסתכל אחורה 14 יום על סיפור, כדי לזהות אירוע שממשיך להתגלגל.
// המקורות שלנו מספקים רק את היממה האחרונה, ולכן החיפוש ההיסטורי נעשה מול Google News.
import Parser from 'rss-parser';
import { keyTokens, overlap } from '../web/src/shared/similar.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsFive/1.0)' }
});

const RELEVANCE = 0.10;   // סף חפיפה בין תוצאת החיפוש לסיפור המקורי

// החיפוש סורק את כל העיתונות, כולל אתרים שאינם ברשימת המקורות.
// כשיש כמה כתבות מאותו יום, עדיף להציג את הגוף המוכר.
const PREFERRED = [
  'ynet', 'mako', 'n12', 'הארץ', 'haaretz', 'דבר', 'davar', 'גלובס', 'globes',
  'כאן', 'kan', 'calcalist', 'כלכליסט', 'שיחה מקומית', 'שקוף', 'timesofisrael',
  'themarker', 'זמן ישראל', 'walla', 'מעריב', 'ישראל היום'
];

const isPreferred = outlet =>
  PREFERRED.some(name => (outlet || '').toLowerCase().includes(name.toLowerCase()));
const MAX_TERMS = 3;

// פעלים ומילות קישור שחוזרים בכל כותרת חדשותית ולכן אינם מזהים סיפור מסוים
const GENERIC = new Set([
  'אחרי','לאחר','בתוך','למרות','בגלל','הודיע','הודיעה','אמר','אמרה','טען','טענה',
  'דיווח','דיווחו','דיווחה','נחשף','חושף','חשף','מדווח','לפרסום','הותר','בלעדי',
  'תיעוד','צפו','ראיון','פרשנות','ניתוח','עדכון','מבזק','כתבה','דעה','טור',
  'כך','עוד','שוב','בכיר','בכירים','גורם','גורמים','היום','אמש','הלילה','הבוקר',
  'ישראל','ישראלי','ישראלית','חדשות','דקות','שעות','שנים','מיליון','מיליארד'
]);

/** מפרק כותרת למילים, בלי לקצץ תחיליות — מנוע חיפוש מוצא יותר עם המילה המלאה. */
function titleWords(title) {
  return String(title)
    // שומר גרש ואפוסטרוף בתוך מילה: "ח'ותים" ו"אנת'רופיק" הן מילה אחת, לא שתיים
    .replace(/["״,.:;!?()\[\]|•\-–—\/]/g, ' ')
    .replace(/(^|\s)['׳]|['׳](\s|$)/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 4 && !GENERIC.has(w) && !/^\d+$/.test(w));
}

const stem = w => w.replace(/^(ו|ה|ב|ל|מ|ש|כ)/, '');

/**
 * בונה מדד נדירות מכל כותרות היום. מילה שמופיעה בכותרת אחת מזהה סיפור;
 * מילה שחוזרת בעשרים כותרות היא רעש. אורך המילה הוא קירוב גרוע לזה.
 */
export function buildRarity(stories) {
  const df = new Map();
  for (const s of stories) {
    for (const w of new Set(titleWords(s.title).map(stem))) {
      df.set(w, (df.get(w) || 0) + 1);
    }
  }
  return df;
}

/** בוחר את המילים הנדירות ביותר בכותרת כשאילתת חיפוש. */
function queryFor(story, rarity) {
  const seen = new Set();
  const candidates = [];
  for (const w of titleWords(story.title)) {
    const key = stem(w);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ word: w, df: rarity?.get(key) ?? 1 });
  }

  return candidates
    .sort((a, b) => a.df - b.df || b.word.length - a.word.length)
    .slice(0, MAX_TERMS)
    .map(c => c.word)
    .join(' ');
}

function outletOf(item) {
  // Google News מוסיף " - שם המקור" בסוף הכותרת
  const m = /^(.*) - ([^-]+)$/.exec(item.title || '');
  return m ? { title: m[1].trim(), outlet: m[2].trim() } : { title: item.title || '', outlet: '' };
}

export async function lookback(story, rarity) {
  const query = queryFor(story, rarity);
  if (!query) return null;

  const url = 'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query + ' when:14d') + '&hl=he&gl=IL&ceid=IL:he';

  let feed;
  try { feed = await parser.parseURL(url); }
  catch { return null; }

  const tokens = new Set(keyTokens(story.title + ' ' + story.summary));
  const now = Date.now();

  const related = (feed.items || [])
    .map(item => {
      const { title, outlet } = outletOf(item);
      return { title, outlet, link: item.link, at: item.isoDate || item.pubDate };
    })
    .filter(e => e.at && e.title)
    .filter(e => overlap(tokens, new Set(keyTokens(e.title))) >= RELEVANCE)
    .filter(e => {
      const age = now - new Date(e.at).getTime();
      return age > 0 && age < 15 * 864e5;
    })
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  if (!related.length) return null;

  const days = [...new Set(related.map(e => e.at.slice(0, 10)))];
  const firstAt = related[0].at;
  const ageDays = (now - new Date(firstAt).getTime()) / 864e5;

  // נקודה אחת ליום, כדי שציר הזמן לא יתמלא בעדכוני מבזקים של אותו יום
  const byDay = new Map();
  for (const e of related) {
    const day = e.at.slice(0, 10);
    const current = byDay.get(day);
    if (!current || (!isPreferred(current.outlet) && isPreferred(e.outlet))) byDay.set(day, e);
  }

  return {
    query,
    firstAt,
    ageDays: Number(ageDays.toFixed(1)),
    activeDays: days.length,
    articleCount: related.length,
    outlets: [...new Set(related.map(e => e.outlet).filter(Boolean))],
    timeline: [...byDay.values()]
  };
}

const MIN_AGE_DAYS = 2.5;   // אירוע של אתמול אינו "מתגלגל", הוא פשוט טרי
const MIN_ACTIVE_DAYS = 3;  // חייב סיקור בכמה ימים נפרדים, לא רק התלקחות בודדת
const MIN_ARTICLES = 4;

/** האם האירוע התחיל מזמן ועדיין מדברים עליו. */
export function isOngoing(history) {
  return Boolean(history)
    && history.ageDays >= MIN_AGE_DAYS
    && history.activeDays >= MIN_ACTIVE_DAYS
    && history.articleCount >= MIN_ARTICLES;
}

/** מריץ את החיפוש ההיסטורי על כמה סיפורים במקביל, בלי להציף את השרת בבת אחת. */
export async function lookbackAll(stories, rarity, concurrency = 6) {
  const results = new Map();
  const queue = [...stories];

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const story = queue.shift();
        results.set(story.id, await lookback(story, rarity));
      }
    })
  );

  return results;
}
