// בלוקליסט: חוסם תוכן שהגורם מפרסם בעצמו, לא דיווח עיתונאי עליו.
function norm(s = '') { return s.replace(/["'״׳]/g, '').toLowerCase(); }

export function applyBlocklist(stories, blocklist = {}) {
  const names = (blocklist.names || []).map(norm).filter(Boolean);
  const keywords = (blocklist.keywords || []).map(norm).filter(Boolean);
  if (!names.length && !keywords.length) return { kept: stories, blocked: [] };

  const kept = [], blocked = [];
  for (const s of stories) {
    const hay = norm(s.title + ' ' + s.summary);
    const hitKeyword = keywords.find(k => hay.includes(k));
    const hitName = names.find(n => hay.includes(n));

    // מילת מפתח חוסמת תמיד. שם חוסם רק אם זה תוכן שלו — טור, ראיון או ציטוט בכותרת.
    const selfPublished = s.isOpinion || /^\s*["״]/.test(s.title) || /[:]\s*["״]/.test(s.title);
    const reason = hitKeyword ? `מילת מפתח: ${hitKeyword}`
                 : (hitName && selfPublished) ? `תוכן של ${hitName}`
                 : null;

    if (reason) blocked.push({ ...s, blockReason: reason });
    else kept.push(s);
  }
  return { kept, blocked };
}
