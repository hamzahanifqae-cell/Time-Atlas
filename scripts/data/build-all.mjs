#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const steps = ["build-geo.mjs", "build-boundaries.mjs", "build-textures.mjs"];

for (const step of steps) {
  console.log(`\n=== ${step} ===`);
  const { stdout, stderr } = await run("node", [path.join(__dirname, step)]);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}
