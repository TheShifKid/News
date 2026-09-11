// איחוד ידיעות על אותו אירוע ממקורות שונים, לפי חפיפת מילים משמעותיות.
import { keyTokens, overlap } from '../web/src/shared/similar.js';

const tokens = s => new Set(keyTokens(s));
const jaccard = overlap;

const SIX_HOURS = 6 * 3600 * 1000;

export function cluster(items, threshold = 0.15) {
  const withTokens = items.map(it => ({ it, tok: tokens(it.title + ' ' + it.summary) }));
  const clusters = [];

  for (const cur of withTokens) {
    let best = null, bestScore = threshold;
    for (const c of clusters) {
      // אירועים רחוקים בזמן הם כנראה סיפורים שונים, גם אם המילים דומות
      if (Math.abs(new Date(cur.it.publishedAt) - new Date(c.items[0].publishedAt)) > SIX_HOURS * 4) continue;
      const s = jaccard(cur.tok, c.tok);
      if (s > bestScore) { best = c; bestScore = s; }
    }
    if (best) {
      best.items.push(cur.it);
      for (const w of cur.tok) best.tok.add(w);
    } else {
      clusters.push({ items: [cur.it], tok: new Set(cur.tok) });
    }
  }

  return clusters.map(c => {
    // הידיעה המייצגת: זו עם התקציר העשיר ביותר, כי היא תוצג בכרטיס
    const items = c.items.sort((a, b) => b.summary.length - a.summary.length);
    const lead = items[0];
    const topics = [...new Set(items.flatMap(i => i.topics))];
    return {
      id: lead.id,
      title: lead.title,
      summary: lead.summary,
      image: items.find(i => i.image)?.image || null,
      topics,
      isOpinion: items.every(i => i.isOpinion),
      publishedAt: items.map(i => i.publishedAt).sort().at(-1),
      sources: items.map(i => ({ id: i.source.id, name: i.source.name, lean: i.source.lean, link: i.link, title: i.title })),
      // סיקור נמדד לפי גופי חדשות שונים. שני פידים של אותו אתר אינם שני מקורות.
      coverage: new Set(items.map(i => i.source.id.split('-')[0])).size
    };
  });
}
