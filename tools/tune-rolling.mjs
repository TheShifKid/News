// מריץ את החיפוש ההיסטורי פעם אחת ושומר את התוצאות, כדי לכייל ספים בלי רשת.
import { writeFile } from 'node:fs/promises';
import { collect } from '../pipeline/collect.js';
import { rank } from '../web/src/shared/rank.js';
import { buildRarity, lookbackAll } from '../pipeline/lookback.js';
import { CONFIG_DIR } from '../pipeline/paths.js';
import { readFile } from 'node:fs/promises';

const defaults = JSON.parse(await readFile(new URL('../web/src/shared/defaults.json', import.meta.url), 'utf8'));
const { stories } = await collect(CONFIG_DIR);
const rarity = buildRarity(stories);
const top = rank(stories, defaults).slice(0, 40);
const results = await lookbackAll(top, rarity);

const rows = top.map(s => ({
  title: s.title,
  kinds: [...new Set(s.sources.map(x => x.kind))],
  h: results.get(s.id)
})).filter(r => r.h);

await writeFile('rolling-candidates.json', JSON.stringify(rows, null, 1));

rows.sort((a, b) => b.h.articleCount - a.h.articleCount);
for (const r of rows) {
  const { ageDays, activeDays, articleCount, outlets } = r.h;
  console.log(
    `${String(articleCount).padStart(2)}כת ${String(activeDays)}ימ ${String(outlets.length)}גופ גיל${String(ageDays).padStart(5)} ${r.kinds.join('/').padEnd(13)} ${r.title.slice(0, 46)}`
  );
}
