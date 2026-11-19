# Leonida Trophy Atlas

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for [make.fun's GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01). Static files, no build step, no network requests: serve `app/` anywhere and it works with the network off.

## What it does

- **Checklist tracker** — every trophy with its official name, description and grade, earned checkboxes, per-trophy notes, and progress saved in the browser (localStorage) with export, import and reset.
- **Filters and search** — by kind (story, strangers, collectibles, activities, feats, 100%), by grade, by status (earned / remaining / missable / unconfirmed), free-text search, and four sort orders (roadmap, A–Z, rarest first, grade).
- **Spoiler blur** — the 28 hidden trophies stay blurred until earned, with click-to-reveal.
- **Roadmap** — five stages to the platinum (story 60–80h → 100% grind ~100h → strangers ~10h → feats ~5h → platinum), each with its trophies and progress.
- **Missables** — the one missable trophy, Positive Mental Attitude, with the exact Chapter 1 steps, plus why everything else is safe.
- **A cited guide for every trophy** — written in our own words from the verified facts, naming its sources. Three trophies PowerPyx still lists as unconfirmed say so plainly instead of guessing.

## Data

Checked 19 November 2026 (launch day) against live sources:

- [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) — names, descriptions, grades, earn-rate %
- [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi) — names, descriptions, grades, PSN progress targets
- [PowerPyx](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) — roadmap, missables, per-trophy methods
- [GTA Zone](https://gta-zone.com/news/gta-6-trophies-achievements/) — hidden / visible split

The list: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online. Difficulty 4/10, about 200 hours, one playthrough (PowerPyx).

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Deep links: `?view=roadmap`, `?view=missables`, `?trophy=28`, `?spoilers=off`, `?seed=demo` (13 trophies pre-earned, for a quick look).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT — see [LICENSE](LICENSE). An unofficial fan guide: trophy names and descriptions are PlayStation's; no Rockstar logo or artwork is used.
