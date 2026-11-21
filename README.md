# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/ahh955/Gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline, open-source guide and tracker for all **55 GTA VI trophies** (1 Platinum / 2 Gold / 6 Silver / 46 Bronze, 28 hidden), built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What is inside

- **448 cited claims** — every guide step and fact cites its sources by number, e.g. [S1]. 295 claims are backed by 2 or more sources; 0 claims are uncited.
- **20 sources**, all read 21 Nov 2026 (13 opened in full, 7 read via search results) — PowerPyx, Push Square, KeenGamer, GTABase, Gamemapa, Mobalytics, Exophase, Insider Gaming, GGRecon, GamesFuze, EGamers, TechTroduce, Leonida Unlocked and seven more.
- **30 source disputes** — where launch-week guides disagree, both cited versions are shown with an "Our call" verdict.
- **26 interactive YOUR COUNT trackers** — − / + counters with progress bars for every grind and count trophy (stunts, races, cards, scans, vaults, cash, and more).
- **14 missable / at-risk trophies** — with the window that opens and shuts, plus "Protect it" advice. Only one trophy is truly missable: Positive Mental Attitude (Chapter 1 balcony meditation).
- **NEXT UP panel** — the next trophies in roadmap order, with stage, chapter and missable flags, updating as you tick things off.
- **5-stage roadmap** — ~200 hours, from the story (Chapters 1–5) through the 100% checklist to the Platinum.
- **1,350-point system** (Platinum 220, Gold 85, Silver 45, Bronze 15) and per-chapter progress in the header.
- **Rarity %** on all 55 trophies (Exophase, read 21 Nov 2026), spoiler masking of hidden story trophies until earned, filters, search, sort, export/import of progress, an audit strip and a per-source claim matrix, and deep links to every trophy (#t1 … #t55).

Five hidden trophies were still unsolved on 21 Nov 2026 (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin) — the guide says so plainly and gives the best current lead instead of inventing a method.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

No build step, no dependencies, no network: the app loads only its own files under `app/`. Source links open only when the reader follows them.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

```
app/
  index.html            single-page app: Tracker / Next Up / Roadmap / Missables / Disputes / Sources / Audit
  css/style.css         original dark sunset theme
  js/app.js             loads the data, renders the views, saves progress in localStorage
  data/
    trophies.json       all 55 trophies: guide text, 358 cited claims, rarity, points, counters, windows
    sources.json        20 sources with site, URL and read date
    disputes.json       30 disputes, each with two cited versions and a verdict
    roadmap.json        5 stages with hours + trophy lists, and the NEXT UP order
screenshots/           4 screenshots of the finished app (1280×720)
main.ts                 entrypoint: copies app/ + screenshots/ and writes dossier.json
serve.ts                tiny static server for local use
vendor/makefun-frontend.ts   kit vendor library, unchanged
```

## Sources

All guide text is original — sources are cited, never copied. Trophy names and descriptions are as PlayStation publishes them (including the masked name “T**s Ass Drug Money”). Rarity figures are Exophase's tracked percentages, read 21 Nov 2026, two days after launch; early figures that will rise fast. See the Sources tab in the app for the full list with links and read dates.

## License

MIT — see [LICENSE](LICENSE).
