// זיכרון קצר של ידיעות מהימים האחרונים, כדי להציג ציר זמן לסיפור מתגלגל.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_DIR } from './paths.js';
import { keyTokens, overlap } from '../web/src/shared/similar.js';

const FILE = join(PUBLIC_DIR, 'history.json');
const KEEP_DAYS = 14;
const MATCH = 0.18;

let memory = null;

async function load() {
  if (memory) return memory;
  try { memory = JSON.parse(await readFile(FILE, 'utf8')); }
  catch { memory = []; }
  return memory;
}

export async function remember(stories) {
  const entries = await load();
  const known = new Set(entries.map(e => e.id));
  const cutoff = Date.now() - KEEP_DAYS * 864e5;

  for (const s of stories) {
    if (known.has(s.id)) continue;
    entries.push({
      id: s.id,
      title: s.title,
      at: s.publishedAt,
      link: s.sources[0]?.link,
      source: s.sources[0]?.name,
      tokens: keyTokens(s.title + ' ' + s.summary)
    });
  }

  memory = entries.filter(e => new Date(e.at).getTime() > cutoff);
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(memory));
  return memory;
}

/** מחזיר את ההתפתחויות הקודמות של סיפור, מהישן לחדש. */
export async function timelineFor(story) {
  const entries = await load();
  const tokens = new Set(keyTokens(story.title + ' ' + story.summary));

  const related = entries
    .filter(e => e.id !== story.id && new Date(e.at) < new Date(story.publishedAt))
    .filter(e => overlap(tokens, new Set(e.tokens)) >= MATCH)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  // יום אחד = נקודה אחת בציר, כדי שהציר לא יתפוצץ מעדכוני מבזקים
  const byDay = new Map();
  for (const e of related) byDay.set(e.at.slice(0, 10), e);
  return [...byDay.values()].slice(-5);
}
