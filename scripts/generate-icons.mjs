import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Write crisp SVG favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E6A84C"/>
      <stop offset="50%" stop-color="#2EC4B6"/>
      <stop offset="100%" stop-color="#6B8EFE"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="#0E1013"/>
  <rect x="6" y="6" width="116" height="116" rx="24" fill="none" stroke="#272D39" stroke-width="2"/>
  <circle cx="64" cy="64" r="38" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round" stroke-dasharray="198 42" transform="rotate(-35 64 64)"/>
  <circle cx="64" cy="64" r="10" fill="#F3EFE6"/>
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

// CRC32 helper for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgbaPixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter type 0
    rgbaPixels.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawKaizenIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.31;
  const innerR = size * 0.21;
  const dotR = size * 0.085;
  const cornerR = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rect mask
      const rx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
      const ry = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
      const rectDist = Math.hypot(rx, ry) - cornerR;

      let r = 14;
      let g = 16;
      let b = 19;
      let a = 255;

      if (rectDist > 1) {
        a = 0;
      } else {
        // Subtle radial glow in center
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const bgBoost = Math.max(0, 1 - dist / (size * 0.65)) * 12;
        r += bgBoost;
        g += bgBoost + 2;
        b += bgBoost + 6;

        // Open enso-style mastery ring with 3-stop gradient
        const angle = Math.atan2(dy, dx); // -PI to PI
        const normAngle = (angle + Math.PI) / (2 * Math.PI);
        // Leave a deliberate calligraphic gap around upper-right (-0.45 rad to 0.05 rad)
        const inGap = angle > -0.52 && angle < 0.08;

        if (!inGap && dist >= innerR && dist <= outerR) {
          const edgeFade = Math.min(
            1,
            Math.min(dist - innerR, outerR - dist) / (size * 0.015)
          );
          // Blend Guitar gold -> Bouldering teal -> Japanese indigo
          let rr, gg, bb;
          if (normAngle < 0.5) {
            const t = normAngle * 2;
            rr = lerp(230, 46, t);
            gg = lerp(168, 196, t);
            bb = lerp(76, 182, t);
          } else {
            const t = (normAngle - 0.5) * 2;
            rr = lerp(46, 107, t);
            gg = lerp(196, 142, t);
            bb = lerp(182, 254, t);
          }
          r = lerp(r, rr, edgeFade);
          g = lerp(g, gg, edgeFade);
          b = lerp(b, bb, edgeFade);
        }

        // Center focal dot (warm ivory)
        if (dist <= dotR) {
          const dotFade = Math.min(1, (dotR - dist) / (size * 0.015));
          r = lerp(r, 243, dotFade);
          g = lerp(g, 239, dotFade);
          b = lerp(b, 230, dotFade);
        }

        if (rectDist > 0) {
          a = Math.round(255 * (1 - rectDist));
        }
      }

      buf[idx] = Math.round(Math.max(0, Math.min(255, r)));
      buf[idx + 1] = Math.round(Math.max(0, Math.min(255, g)));
      buf[idx + 2] = Math.round(Math.max(0, Math.min(255, b)));
      buf[idx + 3] = Math.round(Math.max(0, Math.min(255, a)));
    }
  }
  return encodePng(size, size, buf);
}

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  const png = drawKaizenIcon(t.size);
  fs.writeFileSync(path.join(iconsDir, t.name), png);
  console.log(`Generated public/icons/${t.name} (${png.length} bytes)`);
}
