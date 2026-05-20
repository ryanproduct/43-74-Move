#!/usr/bin/env node
// scripts/make-icons.mjs
//
// Rasterize public/icons/move-hq-icon.svg into the two PNG sizes referenced
// by the PWA manifest. Run after editing the canonical SVG.
//
// Requires librsvg on the PATH:
//   brew install librsvg
//
// Usage:
//   node scripts/make-icons.mjs
//
// Output (overwritten on each run):
//   public/icons/icon-192.png
//   public/icons/icon-512.png

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const SVG = "public/icons/move-hq-icon.svg";
const SIZES = [192, 512];

if (!existsSync(SVG)) {
  console.error(`Source SVG not found at ${SVG}`);
  process.exit(1);
}

try {
  execSync("which rsvg-convert", { stdio: "ignore" });
} catch {
  console.error("rsvg-convert not found. Install via:  brew install librsvg");
  process.exit(1);
}

for (const size of SIZES) {
  const out = `public/icons/icon-${size}.png`;
  execSync(`rsvg-convert -w ${size} -h ${size} ${SVG} -o ${out}`, {
    stdio: "inherit",
  });
  console.log(`✓ ${out}`);
}
