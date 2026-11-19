// Leonida Trophy Atlas — the entrypoint (Node 22, standard library only).
//
// The guide itself is app/: static files a browser opens at app/index.html,
// offline, with the trophy list and guides in app/data/trophies.json. This
// program hands it in: it copies app/ and screenshots/ beside this file into
// the output directory and writes /output/dossier.json — the screenshots plus
// the text the judge reads — with the vendored make.fun library.
//
// vendor/makefun-frontend.ts must stay exactly as the kit ships it: the
// scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
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
