// מייצר אייקוני PWA ללא תלויות: ריבוע דיו עם סימן בצבע הדגש.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../server/src/paths.js';

const INK = [13, 15, 19], SIGNAL = [224, 86, 45];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const bar = { top: size * 0.42, bottom: size * 0.58, start: size * 0.22, end: size * 0.78 };
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      // פס אופקי אחד — קו הכותרת של עיתון, מקוצר לצד אחד
      const inBar = y > bar.top && y < bar.bottom && x > bar.start && x < bar.end;
      const shortBar = y > bar.bottom + size * 0.08 && y < bar.bottom + size * 0.16
                    && x > bar.start && x < size * 0.55;
      const [r, g, b] = inBar || shortBar ? SIGNAL : INK;
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: truecolor

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

for (const size of [192, 512]) {
  const file = join(ROOT, 'web', 'public', `icon-${size}.png`);
  writeFileSync(file, png(size));
  console.log('נוצר', file);
}
