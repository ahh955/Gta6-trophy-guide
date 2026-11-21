# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides and tracks all **55 PlayStation 5 trophies** of
Grand Theft Auto VI: the official list with saved progress, a roadmap to the
platinum, the missables flagged, and a guide to each trophy in our own words
that cites its sources. Entry for
[make.fun's gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Dense 3-pane tracker** — trophy list (grouped by roadmap stage) on the
  left, the full opened guide in the centre, NEXT UP in roadmap order plus the
  per-trophy sources panel on the right. One screen shows the audit strip, the
  list, a guide, a dispute, a counter and the next-up list at once.
- **455 cited claims** across all 55 trophies (numbered steps + cited facts),
  **305 backed by 2+ sources**, zero uncited. Every claim carries its citation
  numbers, and every trophy names the pages behind it.
- **30 disputes** in "SOURCES DIFFER — BOTH VERSIONS SHOWN" A/B format, each
  with an "Our call" verdict.
- **14 missable/at-risk trophies** with open/shut windows and "Protect it"
  advice — including Positive Mental Attitude, the only possibly missable
  trophy (Chapter 1 balcony meditation).
- **20 sources, all read 21 Nov 2026** — PowerPyx, KeenGamer, Push Square,
  GTABase, OutputLog, Insider Gaming, EGamers, Sixshore, FullSweep,
  PlanetGTA6, GTA Vice City Hub, GamesFuze, Mobalytics, GTASix.how,
  TechForNerd, HappyGamer and Exophase (for the official names, descriptions,
  grades and rarity). PSNProfiles was blocked (HTTP 403) on 21 Nov, so it is
  not cited.
- **28 interactive YOUR COUNT trackers** with −/+ buttons and progress bars
  for the grind and count trophies.
- **5-stage roadmap** (~200 hours) with per-stage trophy lists and progress,
  **1,350 PSN points** with per-stage progress in the header, rarity % on all
  55, spoiler masking for hidden story trophies, filters (kind, grade,
  missable, PSN-hidden, disputed, not earned), search, export/import of
  progress, an audit strip, a source matrix and deep links (`#t28`).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static HTTP server. The app fetches nothing at run
time except its own `data/trophies.json`, and works with the network off. Source
links open only when the reader follows them.

## Layout

- `app/index.html` — the shell: header, audit strip, tabs, filters, 3 panes
- `app/css/app.css` — the dense dark ledger look
- `app/js/app.js` — tracker, filters, spoiler shield, counters, export/import,
  roadmap / missables / disputes / sources views
- `app/data/trophies.json` — the official 55 (names, descriptions, grades,
  hidden flags, rarity, Gamerscore, points) plus our own cited guides,
  disputes, missable windows, counters, sources and roadmap
- `main.ts` — the entry program: copies `app/` + `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-frontend.ts` — the kit's copy, unchanged
- `screenshots/` — 4 real renders of the app's own code

## Notes

- Guide text is our own words, written for this entry. The official trophy
  names and descriptions are shown as PlayStation publishes them.
- No Rockstar Games logo, official artwork, box art or screenshot of the game.
- Rarity percentages are Exophase's tracked-player figures as read on
  21 Nov 2026, days after launch, so they will move fast.

## License

MIT — see [LICENSE](LICENSE).
