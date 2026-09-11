import Parser from 'rss-parser';
import { readFile } from 'node:fs/promises';
import { normalize } from './normalize.js';
import { cluster } from './cluster.js';
import { isNoise } from './noise.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsFive/1.0)' },
  // שדות לא סטנדרטיים ש-N12 מספק ושווים לנו
  customFields: { item: ['shortDescription', 'image', 'image624X383', 'photographer'] }
});

const MAX_AGE_HOURS = 36;

export async function fetchItems(configDir) {
  const { sources } = JSON.parse(await readFile(`${configDir}/sources.json`, 'utf8'));

  const results = await Promise.allSettled(
    sources.map(async src => {
      const feed = await parser.parseURL(src.url);
      return feed.items.map(i => normalize(i, src));
    })
  );

  const items = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value);
    else errors.push({ source: sources[i].id, error: String(r.reason?.message || r.reason) });
  });

  const cutoff = Date.now() - MAX_AGE_HOURS * 3600000;
  const fresh = items.filter(i => i.title && i.link && new Date(i.publishedAt).getTime() > cutoff && !isNoise(i));

  // כפילות מדויקת לפי קישור, לפני האשכול היקר יותר
  const seen = new Set();
  const unique = fresh.filter(i => !seen.has(i.link) && seen.add(i.link));

  return { items: unique, errors, fetched: items.length };
}

export async function collect(configDir) {
  const { items, errors, fetched } = await fetchItems(configDir);
  return { stories: cluster(items), errors, fetched, kept: items.length };
}
