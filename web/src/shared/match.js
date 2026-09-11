// התאמת מילות מפתח בעברית. חיפוש substring פשוט יוצר התאמות שווא
// ("ירידה" מכיל "ירי", "בטמפרטורות" מכיל "טור"), ולכן משווים ברמת מילה.
const PREFIX = /^(ו|ה|ב|ל|מ|ש|כ|מה|שה|וה|לה|כש|וב|ול|ומ)/;

export function tokenize(text = '') {
  return String(text)
    .replace(/["'״׳,.:;!?()\[\]|•\-–—\/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function variants(word) {
  const out = [word.toLowerCase()];
  const stripped = word.toLowerCase().replace(PREFIX, '');
  if (stripped.length >= 3 && stripped !== out[0]) out.push(stripped);
  return out;
}

/** בונה פונקציית בדיקה מהירה עבור רשימת מילות מפתח. */
export function makeMatcher(keywords) {
  const phrases = [];   // ביטויים מרובי מילים — substring בטוח מספיק
  const single = new Map();
  for (const raw of keywords) {
    const k = String(raw).trim().toLowerCase().replace(/["'״׳]/g, '');
    if (!k) continue;
    if (/\s/.test(k)) phrases.push(k);
    else single.set(k, raw);
  }

  return function match(text) {
    const lower = String(text).toLowerCase().replace(/["'״׳]/g, '');
    const hits = new Set();
    for (const p of phrases) if (lower.includes(p)) hits.add(p);

    for (const tok of tokenize(lower)) {
      for (const v of variants(tok)) {
        if (single.has(v)) { hits.add(v); continue; }
        // התאמת תחילית לנטיות (מניה → מניות), רק למילים ארוכות מספיק
        for (const k of single.keys()) {
          if (k.length >= 4 && v.length > k.length && v.length - k.length <= 3 && v.startsWith(k)) hits.add(k);
        }
      }
    }
    return [...hits];
  };
}
