// Génère 4 JPEG 4:5 factices par voyage (à remplacer par les vraies photos).
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = new URL('../src/content/trips/', import.meta.url).pathname;
const W = 1600;
const H = 2000;

const svg = (label) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <pattern id="s" width="45" height="45" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="45" height="45" fill="#161615"/>
      <rect width="22.5" height="45" fill="#1d1d1c"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#s)"/>
  <text x="48" y="${H - 56}" font-family="monospace" font-size="40" fill="#6c6b67">${label}</text>
</svg>`;

for (const file of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const name = /^name: (.+)$/m.exec(
    await readFile(join(dir, file), 'utf8'),
  )?.[1];
  await mkdir(join(dir, slug), { recursive: true });
  for (let n = 1; n <= 4; n++) {
    await sharp(Buffer.from(svg(`photo ${n} — ${name}`)))
      .jpeg({ quality: 70 })
      .toFile(join(dir, slug, `0${n}.jpg`));
  }
}
