// נקודת הכניסה של הרובוט בענן: מושך חדשות, מאחד, ושומר קובץ סטטי שהאתר קורא.
// הדירוג והסינון האישי נעשים בדפדפן, כדי שההעדפות יישארו על המכשיר ולא בענן.
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { collect } from '../pipeline/collect.js';
import { remember, timelineFor } from '../pipeline/history.js';
import { enrichStories, enrichmentEnabled } from '../pipeline/enrich.js';
import { rank } from '../web/src/shared/rank.js';
import { CONFIG_DIR, PUBLIC_DIR } from '../pipeline/paths.js';
import { readFile } from 'node:fs/promises';

const defaults = JSON.parse(
  await readFile(new URL('../web/src/shared/defaults.json', import.meta.url), 'utf8')
);

console.log('מושך פידים…');
const { stories, errors, fetched } = await collect(CONFIG_DIR);
console.log(`התקבלו ${fetched} פריטים → ${stories.length} סיפורים`);
for (const e of errors) console.warn('  מקור נכשל:', e.source, e.error);

// דירוג עם ברירות המחדל, רק כדי לבחור למי שווה לבנות ציר זמן ולהעשיר
const byDefault = rank(stories, defaults);
const top = byDefault.slice(0, 12);

console.log('בונה צירי זמן…');
const timelines = new Map();
for (const s of top) timelines.set(s.id, await timelineFor(s));
await remember(byDefault.slice(0, 40));

let enriched = new Map();
if (enrichmentEnabled()) {
  console.log('מעשיר עם Gemini…');
  for (const s of await enrichStories(top)) enriched.set(s.id, { why: s.why, background: s.background });
}

const feed = {
  updatedAt: new Date().toISOString(),
  aiEnabled: enrichmentEnabled(),
  sourceErrors: errors,
  // הדפדפן מדרג מחדש לפי ההעדפות של המשתמש, ולכן נשלח הכול בלי סדר מחייב
  stories: stories.map(s => ({
    ...s,
    ...(enriched.get(s.id) || {}),
    timeline: timelines.get(s.id) || []
  }))
};

await mkdir(PUBLIC_DIR, { recursive: true });
await writeFile(join(PUBLIC_DIR, 'feed.json'), JSON.stringify(feed));
console.log(`נשמר feed.json — ${feed.stories.length} סיפורים`);
