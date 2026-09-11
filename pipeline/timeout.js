/**
 * פסק-זמן קשיח סביב הבטחה.
 * פסק-הזמן של rss-parser אינו תופס חיבור שנתקע לפני שהגיעה תשובה,
 * ומשיכה אחת שנתלית עוצרת את כל הריצה.
 */
export function withTimeout(promise, ms) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`פסק-זמן אחרי ${ms / 1000} שניות`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}
