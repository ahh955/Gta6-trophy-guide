// Leonida Ledger — the entrypoint (Node 22, standard library only).
//
// The guide itself is app/: static files a browser opens at app/index.html,
// offline, with the trophy list and cited guides in app/data/trophies.json,
// the numbered sources in app/data/sources.json and the roadmap stages in
// app/data/roadmap.json. This program hands it in: it copies app/ and
// screenshots/ beside this file into the output directory and writes
// /output/dossier.json — the screenshots plus the text the judge reads —
// with the vendored make.fun library.
//
// vendor/makefun-frontend.ts must stay exactly as the kit ships it: the
// scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate the entry before handing it in: the app must exist with its
// index and trophy data, the trophy file must parse and hold all 55
// trophies, and there must be 3–4 screenshots. Failing here, loudly, beats
// handing in a broken entry the gate rejects without explanation.
function validate() {
  const problems = [];
  const index = join(repoRoot, 'app', 'index.html');
  const data = join(repoRoot, 'app', 'data', 'trophies.json');
  if (!existsSync(index)) problems.push('missing app/index.html');
  if (!existsSync(data)) {
    problems.push('missing app/data/trophies.json');
  } else {
    try {
      const doc = JSON.parse(readFileSync(data, 'utf-8'));
      const trophies = Array.isArray(doc) ? doc : doc.trophies;
      if (!Array.isArray(trophies) || trophies.length !== 55) {
        problems.push(`trophies.json holds ${Array.isArray(trophies) ? trophies.length : 'no'} trophies, expected 55`);
      } else {
        const bad = trophies.filter((t) => typeof t.name !== 'string' || !t.name || typeof t.guide !== 'string' || !t.guide.trim());
        if (bad.length) problems.push(`${bad.length} trophies lack a name or guide`);
      }
    } catch (err) {
      problems.push(`trophies.json does not parse: ${err.message}`);
    }
  }
  const shotsIn = join(repoRoot, 'screenshots');
  if (!existsSync(shotsIn)) {
    problems.push('missing screenshots/');
  } else {
    const shots = readdirSync(shotsIn).filter((f) => !f.startsWith('.'));
    if (shots.length < 3 || shots.length > 4) problems.push(`screenshots/ holds ${shots.length} files, expected 3–4`);
  }
  if (problems.length) {
    throw new Error(`Leonida Ledger validation failed:\n- ${problems.join('\n- ')}`);
  }
}

function handIn() {
  validate();
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  const shotsOut = join(outputDir, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });
  // The gate's own caps: dossier text at most 160 KiB, at most 4 screenshots
  // of at most 256 KiB each, app/ at most 993 entries and 48 MiB.
  writeFileSync(
    join(outputDir, 'dossier.json'),
    buildDossier(outputDir, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
    }),
  );
}

handIn();
