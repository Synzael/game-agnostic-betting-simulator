/**
 * Generate PWA icons using sharp
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public', 'icons');

const sizes = [192, 512];

// Simple ladder icon SVG
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f172a" rx="${size * 0.125}"/>
  <g fill="none" stroke="#22c55e" stroke-width="${size * 0.05}" stroke-linecap="round">
    <line x1="${size * 0.3}" y1="${size * 0.25}" x2="${size * 0.7}" y2="${size * 0.25}"/>
    <line x1="${size * 0.3}" y1="${size * 0.4}" x2="${size * 0.7}" y2="${size * 0.4}"/>
    <line x1="${size * 0.3}" y1="${size * 0.55}" x2="${size * 0.7}" y2="${size * 0.55}"/>
    <line x1="${size * 0.3}" y1="${size * 0.7}" x2="${size * 0.7}" y2="${size * 0.7}"/>
    <line x1="${size * 0.3}" y1="${size * 0.2}" x2="${size * 0.3}" y2="${size * 0.75}"/>
    <line x1="${size * 0.7}" y1="${size * 0.2}" x2="${size * 0.7}" y2="${size * 0.75}"/>
  </g>
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.05}" fill="#22c55e"/>
</svg>
`;

async function generateIcons() {
  await mkdir(publicDir, { recursive: true });

  for (const size of sizes) {
    const svg = Buffer.from(createSvg(size));
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
