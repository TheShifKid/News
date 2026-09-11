import { classify } from '../web/src/shared/topics.js';
import { makeMatcher } from '../web/src/shared/match.js';

const STRIP_TAGS = /<[^>]*>/g;
const ENTS = { '&quot;': '"', '&apos;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&#39;': "'" };

export function clean(html = '') {
  let s = String(html).replace(STRIP_TAGS, ' ');
  for (const [k, v] of Object.entries(ENTS)) s = s.split(k).join(v);
  return s.replace(/\s+/g, ' ').trim();
}

function firstImage(item) {
  if (item.image) return typeof item.image === 'string' ? item.image : item.image.url;
  if (item.image624X383) return item.image624X383;
  if (item.enclosure?.url) return item.enclosure.url;
  const m = /<img[^>]+src=['"]([^'"]+)['"]/i.exec(item['content:encoded'] || item.content || item.description || '');
  return m ? m[1] : null;
}

// N12 מוסיף קידומת קטגוריה לכותרת בערוצים מסוימים; Ynet לפעמים מוסיף " | ynet"
function tidyTitle(t = '') {
  return clean(t).replace(/\s*\|\s*(ynet|וואלה|מעריב).*$/i, '').trim();
}

export function normalize(item, source) {
  const title = tidyTitle(item.title);
  // N12 נותן shortDescription נקי — עדיף עליו על פני description שמכיל HTML
  const rawSummary = item.shortDescription || item.contentSnippet || item.description || '';
  let summary = clean(rawSummary);
  // תבליטים של N12 מופרדים ב-• — שומר רק את שני הראשונים כדי לקצר
  if (summary.includes('•')) summary = summary.split('•').slice(0, 2).join(' • ').trim();
  if (summary.length > 320) summary = summary.slice(0, 317).trimEnd() + '…';

  const published = item.isoDate || item.pubDate;
  const ts = published ? new Date(published).getTime() : Date.now();

  return {
    id: item.guid || item.link,
    title,
    summary: summary === title ? '' : summary,
    link: item.link,
    image: firstImage(item),
    publishedAt: new Date(isNaN(ts) ? Date.now() : ts).toISOString(),
    source: { id: source.id, name: source.name, lean: source.lean },
    topics: classify(title + ' ' + summary),
    isOpinion: isOpinion(item, source, title)
  };
}

// הבחנה בין דיווח עיתונאי לבין תוכן שגורם מפרסם בעצמו (טור דעה / ראיון)
const matchOpinion = makeMatcher(['טור', 'דעה', 'פרשנות', 'מאמר', 'ראיון', 'עמדה', 'בלוג', 'דעות']);
function isOpinion(item, source, title) {
  const cats = [].concat(item.categories || []).map(c => String(c?._ ?? c));
  const hay = cats.join(' ') + ' ' + title;
  if (source.topics?.includes('opinion') && /opinion|blog|dea|column/.test(item.link || '')) return true;
  return matchOpinion(hay).length > 0;
}
