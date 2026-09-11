// מילים משמעותיות להשוואת ידיעות. משותף לאשכול ולציר הזמן.
const STOP = new Set(['של','על','את','עם','לא','כי','אבל','גם','הוא','היא','הם','זה','זאת','אשר','כל','או','אם','מה','מי','עוד','אחרי','לפני','בין','לפי','כדי','יותר','כבר','רק','שלא','היה','הייתה','יהיה','אין','יש','כמו','נגד','תוך','אל','מן','הזה','הזאת','ראשון','בתוך']);

export function keyTokens(text = '') {
  return [...new Set(
    text.replace(/["'״׳,.:;!?()\[\]|•\-–—]/g, ' ')
        .split(/\s+/)
        .map(w => w.replace(/^(ו|ה|ב|ל|מ|ש|כ)(?=.{3,})/, ''))
        .filter(w => w.length >= 3 && !STOP.has(w))
  )];
}

export function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}
