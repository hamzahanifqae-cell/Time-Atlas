#!/usr/bin/env node
/**
 * Builds public/textures/{earth-day.jpg,earth-night.jpg} from the raw NASA sources.
 * Both are public-domain NASA Visible Earth / Earth Observatory imagery, resized and
 * re-compressed locally for web delivery. See /DATA_SOURCES.md for the originals.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { RAW_DIR, TEXTURES_DIR } from "./lib/paths.mjs";

const WIDTH = 2048;
const HEIGHT = 1024;

async function main() {
  await mkdir(TEXTURES_DIR, { recursive: true });

  await sharp(path.join(RAW_DIR, "earth-day-source.jpg"))
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(TEXTURES_DIR, "earth-day.jpg"));

  await sharp(path.join(RAW_DIR, "earth-night-source.tif"))
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(TEXTURES_DIR, "earth-night.jpg"));

  for (const name of ["earth-day.jpg", "earth-night.jpg"]) {
    const { size } = await import("node:fs/promises").then((m) =>
      m.stat(path.join(TEXTURES_DIR, name)),
    );
    console.log(`${name}: ${(size / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
