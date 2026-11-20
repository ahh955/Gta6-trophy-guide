# Leonida Ledger

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for [make.fun's GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01). Static files, no build step, no network requests: serve `app/` anywhere and it works with the network off.

## What it does

- **Cited guides for every trophy** — 201 numbered steps across the 55 trophies, and *every* step cites numbered sources (162 steps cite two or more). All 10 sources were opened and read on 20 November 2026; a page that refused to load (PSNProfiles, HTTP 403) is listed as unread and never cited.
- **Source matrix** — per source, how many of the 55 guides cite it, counted from the data at load, with read dates, depth notes, and what each source was used for.
- **Audit strip** — counts computed from the data at load and shown on the cover: totals, grades, cited claims, multi- vs single-source claims, unconfirmed, distinct hosts, total steps, source count, hidden, missable.
- **Disputes called out** — where the sources genuinely disagree, the trophy says so instead of picking a winner (22 trophies): the 200h vs 300h+ platinum, 12 vs 2 shooting ranges, the partner-unlock mission, the five methods PowerPyx confirmed that other guides still list as unconfirmed, and more.
- **Missables watch list** — the one truly missable trophy (Positive Mental Attitude, Chapter 1 balcony meditation), the time-sensitive Yago race, and five stranger chains carrying a single-source warning; everything else is honestly marked not missable.
- **Roadmap** — four stages to the platinum (story 60–80h → 100% checklist ~100h → strangers & cleanup 10–20h → platinum), difficulty 4/10, one playthrough, no online trophies, manual-save-per-chapter advice, explicit trophy lists per stage.
- **Tracker** — checklist with progress saved in the browser (localStorage), export/import progress JSON, a progress meter, filters (grade, kind, stage, missable, hidden, unconfirmed, disputes, earned status, search), four sort orders, and rarity (earn-rate %) per trophy.
- **Spoiler masking** — the 28 hidden trophies stay masked until earned, with a toggle and click-to-reveal.
- **Deep links & shared progress** — `#view=roadmap&t=t28&filter=missable`, and `#earned=t02,t03` links that load ticks like an import.

## Data

Checked 20 November 2026 (the day after launch) against ten sources, all read that day:

- [PowerPyx](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) — full guide & roadmap, per-trophy methods
- [GTABase](https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series) — full list, Gamerscore, per-trophy tips
- [KeenGamer](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/) — roadmap, 100% threshold tables
- [OutputLag](https://outputlag.com/guides/gta-6-trophy-list/) — list, Gamerscore, Yago warning
- [GTA-Zone](https://gta-zone.com/news/gta-6-trophies-achievements/) — list, Gamerscore, roadmap
- [eGamers](https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/) — list, disagreements, unconfirmed five
- [Push Square](https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap) — WIP guide, 300h estimate, two named ranges
- [GTA Vibes](https://www.gtavibes.com/guides/gta-6-trophy-list-achievements) — list, roadmap
- [GTASpotter](https://gtaspotter.com/en/guides/gta-6-trophies-and-achievements/) — list, all 80 challenges
- [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) — earn-rate % per trophy

The list: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online. Three trophies are still unconfirmed (Strangers & Freaks' remaining strands, Fair Game's animal, Bad Luck, I Guess's method) and say so plainly.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Deep links: `#view=roadmap`, `#view=missables`, `#view=sources`, `#t=t28`, `#earned=t02,t03`. `?seed=demo` pre-earns 13 trophies for a quick look.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT — see [LICENSE](LICENSE). An unofficial fan guide: trophy names and descriptions are PlayStation's; no Rockstar logo or artwork is used.
