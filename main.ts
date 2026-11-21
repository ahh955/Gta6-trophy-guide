// Leonida Trophy Ledger — gta6-trophy-guide-01 entry program (Node 22, stdlib only).
//
// The guide itself is app/: static files (index.html, css, js, data/trophies.json)
// that open in desktop Chrome and work offline. This program hands it in: it
// copies app/ and screenshots/ from beside this file to /output (or
// MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json with
// the vendored make.fun library, exactly as the kit's starter does. The
// vendor/makefun-frontend.ts file is the kit's copy, unchanged: the scorer
// rebuilds the dossier with its own copy and compares byte for byte.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
// Fail loudly if a screenshot is missing: a dossier built from a partial
// set would grade as a thinner entry, and the missing file is a build bug,
// not a judgement call. The four renders are named in shots.json.
for (const shot of ['1-tracker.jpg', '2-roadmap.jpg', '3-missables.jpg', '4-disputes.jpg']) {
  if (!existsSync(join(out, 'screenshots', shot))) {
    throw new Error(`missing screenshot ${shot} — render it before building`);
  }
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files: app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
