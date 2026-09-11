// נקודת הכניסה של הרובוט בענן: מושך חדשות, מאחד, ושומר קובץ סטטי שהאתר קורא.
// הדירוג והסינון האישי נעשים בדפדפן, כדי שההעדפות יישארו על המכשיר ולא בענן.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collect } from '../pipeline/collect.js';
import { buildRarity, lookbackAll, isOngoing, representativeArticle } from '../pipeline/lookback.js';
import { enrichStories, enrichmentEnabled } from '../pipeline/enrich.js';
import { rank } from '../web/src/shared/rank.js';
import { CONFIG_DIR, PUBLIC_DIR } from '../pipeline/paths.js';

const defaults = JSON.parse(
  await readFile(new URL('../web/src/shared/defaults.json', import.meta.url), 'utf8')
);

console.log('מושך פידים…');
const { stories, errors, fetched } = await collect(CONFIG_DIR);
console.log(`התקבלו ${fetched} פריטים → ${stories.length} סיפורים`);
for (const e of errors) console.warn('  מקור נכשל:', e.source, e.error);

// דירוג עם ברירות המחדל, רק כדי לבחור על מי שווה להריץ את הבדיקות היקרות
const byDefault = rank(stories, defaults);
const candidates = byDefault.slice(0, 40);

console.log('בודק אילו סיפורים מתגלגלים כבר כמה ימים…');
const rarity = buildRarity(stories);
const histories = await lookbackAll(candidates, rarity);

const byId = new Map(stories.map(s => [s.id, s]));

const rolling = new Map();
for (const [id, history] of histories) {
  if (isOngoing(history)) {
    // כשכל מה שיש לנו על הסיפור הוא מבזק, העדכון האחרון בציר הזמן הוא
    // כתבה מלאה מגוף חדשות אמיתי, ולכן הוא מה שראוי להציג ולקשר אליו.
    const onlyFlash = byId.get(id)?.sources.every(src => src.kind === 'flash');
    const article = onlyFlash ? representativeArticle(history) : null;

    rolling.set(id, {
      ...(article ? { article } : {}),
      ageDays: history.ageDays,
      activeDays: history.activeDays,
      articleCount: history.articleCount,
      outlets: history.outlets,
      timeline: history.timeline
    });
  }
}
console.log(`נמצאו ${rolling.size} סיפורים מתגלגלים`);

let enriched = new Map();
if (enrichmentEnabled()) {
  console.log('מעשיר עם Gemini…');
  for (const s of await enrichStories(byDefault.slice(0, 12))) {
    enriched.set(s.id, { why: s.why, background: s.background });
  }
}

const feed = {
  updatedAt: new Date().toISOString(),
  aiEnabled: enrichmentEnabled(),
  sourceErrors: errors,
  // הדפדפן מדרג מחדש לפי ההעדפות של המשתמש, ולכן נשלח הכול בלי סדר מחייב
  stories: stories.map(s => ({
    ...s,
    ...(enriched.get(s.id) || {}),
    ...(rolling.has(s.id) ? { rolling: rolling.get(s.id) } : {})
  }))
};

await mkdir(PUBLIC_DIR, { recursive: true });
await writeFile(join(PUBLIC_DIR, 'feed.json'), JSON.stringify(feed));
console.log(`נשמר feed.json — ${feed.stories.length} סיפורים`);
