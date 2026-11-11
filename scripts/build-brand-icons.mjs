// Rasterises the brand sources in public/ into the hosted icon files. Run after editing
// public/favicon.svg or public/og-meeting.svg:  node scripts/build-brand-icons.mjs
//   favicon.ico          32×32 PNG-in-ICO (browsers that ignore the SVG icon)
//   apple-touch-icon.png 180×180 on white — iOS fills transparency with black
//   logo.png             512×512 on white — Organization/publisher logo in the JSON-LD
//   og-meeting.png       1200×630 default social preview
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const pub = resolve('public');
const mark = readFileSync(join(pub, 'favicon.svg'));

// The mark rendered at `inner` px, centred on an opaque white `size` px square.
const onWhite = async (size, inner) => {
  const glyph = await sharp(mark, { density: 72 * inner / 32 }).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
    .composite([{ input: glyph, gravity: 'centre' }]).png().toBuffer();
};

// ICO container holding a single PNG image: 6-byte header + one 16-byte directory entry.
const ico = (png, size) => {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(size, 6); head.writeUInt8(size, 7);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
};

const favicon32 = await sharp(mark, { density: 72 }).resize(32, 32).png().toBuffer();
writeFileSync(join(pub, 'favicon.ico'), ico(favicon32, 32));
writeFileSync(join(pub, 'apple-touch-icon.png'), await onWhite(180, 140));
writeFileSync(join(pub, 'logo.png'), await onWhite(512, 432));
writeFileSync(join(pub, 'og-meeting.png'),
  await sharp(join(pub, 'og-meeting.svg')).resize(1200, 630).png().toBuffer());
console.log('Brand icons written: favicon.ico, apple-touch-icon.png, logo.png, og-meeting.png');
