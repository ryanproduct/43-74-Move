// scripts/make-icons.mjs
//
// One-off PNG icon generator for the PWA manifest. Hand-rolls a minimal PNG
// (no external deps) — IHDR, IDAT (zlib stored / no compression), IEND — so
// we don't have to install `sharp` just for two solid-colour placeholders.
//
// The icons are flat-colour squares matching the dashboard's warm clay
// background, with a centered white "MHQ" wordmark drawn from a tiny 5x7
// bitmap font. Re-run with `node scripts/make-icons.mjs` if you want to
// regenerate them (e.g. after changing the colour palette).
//
// Output:
//   public/icons/icon-192.png
//   public/icons/icon-512.png
//
// To swap in real icons later, replace these two files. The script is left in
// the repo as documentation of how the placeholders were produced.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- palette ----------
// Matches the dashboard reference (#F2EDE3 warm clay). Foreground is a darker
// stone so the icon reads on light home-screen wallpapers and against the
// "any maskable" safe area.
const BG = [0x4a, 0x40, 0x36, 0xff]; // dark stone
const FG = [0xf2, 0xed, 0xe3, 0xff]; // warm clay

// ---------- 5x7 bitmap font (only letters we need) ----------
// Each glyph is 5 cols x 7 rows, encoded as 7 strings of "."/"#".
const FONT = {
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
};

// ---------- pixel buffer ----------
function makePixels(size) {
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    px[i * 4 + 0] = BG[0];
    px[i * 4 + 1] = BG[1];
    px[i * 4 + 2] = BG[2];
    px[i * 4 + 3] = BG[3];
  }
  return px;
}

function setPixel(px, size, x, y, rgba) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  px[i + 0] = rgba[0];
  px[i + 1] = rgba[1];
  px[i + 2] = rgba[2];
  px[i + 3] = rgba[3];
}

function drawGlyph(px, size, glyph, originX, originY, scale, rgba) {
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (glyph[row][col] !== "#") continue;
      const baseX = originX + col * scale;
      const baseY = originY + row * scale;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          setPixel(px, size, baseX + dx, baseY + dy, rgba);
        }
      }
    }
  }
}

function drawWordmark(px, size) {
  // Layout: "MHQ" at ~38% of icon height for visual centre weight, with safe
  // padding so it still reads when the launcher applies a maskable mask.
  const letters = ["M", "H", "Q"];
  const glyphCols = 5;
  const glyphRows = 7;
  const gapCols = 1; // gap between glyphs, in glyph-pixel units
  const totalCols = letters.length * glyphCols + (letters.length - 1) * gapCols;

  // Target width = 50% of icon → derive integer scale.
  const targetW = size * 0.5;
  const scale = Math.max(1, Math.floor(targetW / totalCols));
  const wordW = totalCols * scale;
  const wordH = glyphRows * scale;
  const originX = Math.round((size - wordW) / 2);
  const originY = Math.round((size - wordH) / 2);

  letters.forEach((letter, i) => {
    const glyph = FONT[letter];
    const x = originX + i * (glyphCols + gapCols) * scale;
    drawGlyph(px, size, glyph, x, originY, scale, FG);
  });
}

// ---------- PNG encoder ----------
// Minimal — IHDR + IDAT (deflated raw scanlines, filter 0) + IEND.
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, pixels) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — prepend filter byte (0) to each scanline, then deflate
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = deflateSync(raw);

  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- main ----------
function build(size, outPath) {
  const px = makePixels(size);
  drawWordmark(px, size);
  const png = encodePNG(size, px);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes, ${size}x${size})`);
}

const outDir = resolve(__dirname, "..", "public", "icons");
build(192, resolve(outDir, "icon-192.png"));
build(512, resolve(outDir, "icon-512.png"));
