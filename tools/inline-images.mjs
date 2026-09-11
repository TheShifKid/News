// מטמיע תמונות חיצוניות כ-data URI, כי מציג ה-Artifact חוסם בקשות לדומיינים אחרים.
import { readFile, writeFile } from 'node:fs/promises';

const file = process.argv[2];
let html = await readFile(file, 'utf8');
const urls = [...new Set([...html.matchAll(/src="(https:\/\/[^"]+)"/g)].map(m => m[1]))];

for (const url of urls) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.warn('דילוג', res.status, url); continue; }
  const type = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  html = html.split(`"${url}"`).join(`"data:${type};base64,${b64}"`);
  console.log(Math.round(b64.length / 1024) + 'KB', type, url.slice(0, 60));
}

await writeFile(file, html);
console.log('גודל הקובץ:', Math.round(Buffer.byteLength(html) / 1024) + 'KB');
