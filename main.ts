// Leonida Trophy Ledger — a gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The guide itself is this directory's app/ folder: plain static files a browser opens at
// app/index.html, offline, with the 55 trophies and their cited guides in app/data/trophies.json.
// This program hands the entry in: it copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library, the summary the
// judge reads (screenshots, first-load files and bytes, and the source).
//
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the scorer requires dossier.json to
// be byte for byte what its own copy writes.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB; more
// than 993 files and directories in app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// A one-line receipt for the log: where the entry went and how big the dossier is, so a
// failed or truncated build is obvious at a glance instead of looking complete.
console.log(
  `Leonida Trophy Ledger handed in to ${out} — dossier.json ${statSync(join(out, 'dossier.json')).size.toLocaleString('en-US')} bytes.`,
);
