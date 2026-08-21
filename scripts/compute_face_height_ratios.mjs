// Reads face_coordinates.json and, for every player, computes the ratio of the
// source image's height to the marked face box's height. Writes the result to
// face_height_ratios.csv at the repo root.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coordsPath = path.join(repoRoot, 'face_coordinates.json');
const outPath = path.join(repoRoot, 'face_height_ratios.csv');

const coords = JSON.parse(readFileSync(coordsPath, 'utf8'));

const rows = [['slug', 'image_y', 'image_height', 'face_y', 'face_height', 'ratio']];

for (const [slug, box] of Object.entries(coords)) {
  const imageY = 0;
  const imageHeight = box.imageHeight;
  const faceY = box.y;
  const faceHeight = box.height;
  const ratio = imageHeight / faceHeight;
  rows.push([slug, imageY, imageHeight, faceY, faceHeight, ratio.toFixed(6)]);
}

const csv = rows.map((r) => r.join(',')).join('\n') + '\n';
writeFileSync(outPath, csv, 'utf8');

console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
