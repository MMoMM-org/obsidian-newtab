# New Tab

A plugin for [Obsidian](https://obsidian.md) that replaces the empty new-tab
view with a customizable dashboard — beautiful backgrounds, a clock, a greeting,
a quote, quick search, bookmarks, and recently edited files.

> This is a personal version of, and derived from,
> [obsidian-beautitab](https://github.com/andrewmcgivery/obsidian-beautitab)
> by Andrew McGivery (MIT). See [Attribution](#attribution).

![The New Tab dashboard: a full-screen background, a clock, a greeting, a search box, recent files and bookmarks, and a quote](assets/new-tab-dashboard.png)

## Features

- **Backgrounds** — seasonal/holiday themes via Unsplash, your own local images,
  a custom URL, or transparent modes.
- **Clock** — 12- or 24-hour.
- **Greeting** — customizable, time-of-day aware.
- **Quote** — built-in online quotes (ZenQuotes) or your own custom quotes.
- **Search** — a top-left search button and an inline search box, each wired to a
  search provider of your choice.
- **Bookmarks** — from all groups or a specific group.
- **Recent files** — the five most recently edited notes.
- Every element is individually toggleable from the settings tab.

## Install

### BRAT (recommended while unreleased)

Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, then add
`MMoMM-org/obsidian-newtab` as a beta plugin.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from a release.
2. Copy them into `<vault>/.obsidian/plugins/newtab/`.
3. Reload Obsidian and enable **New Tab** in *Settings → Community plugins*.

## Migrating from BeautiTab

NewTab is derived from BeautiTab, so it can bring your existing BeautiTab
configuration across in one click. When BeautiTab is set up in your vault, NewTab
offers a **one-time, opt-in, non-destructive** import on first run — and leaves an
**Import from BeautiTab** button in the settings tab if you dismiss it. See
[docs/migration.md](docs/migration.md) for what carries over and what doesn't.

## Development

```bash
npm install
npm run dev      # esbuild watch (writes main.js + styles.css to the repo root)
npm run build    # typecheck + production build into build/
npm test         # vitest
npm run lint     # eslint (obsidianmd) + stylelint (scss)
```

To QA in a real Obsidian instance, this repo ships a test vault at `test/NewTab/`
with [hot-reload](https://github.com/pjeby/hot-reload). Open it as a vault and run:

```bash
DEPLOY_VAULT=1 npm run build
```

This mirrors the build into the vault's plugin folder with a dev-stamped version
so Obsidian reloads the bundle on every build. The canonical `manifest.json` is
never modified.

For user-facing guides — installation, configuration, usage, and known issues —
see the [docs/](docs/) directory.

### Adding a greeting language

The `{{greeting}}` time-of-day phrase is translated per language in
[`React/Utils/greetings.ts`](React/Utils/greetings.ts). To add yours, add one
entry to `GREETINGS` (keyed by Obsidian's locale code, e.g. `de`) with the
morning/afternoon/evening phrases, plus a matching name in `LANGUAGE_LABELS` —
then open a PR. Nothing else needs to change; it appears in the **Greeting
language** dropdown automatically.

## Privacy

New Tab is local-first and makes only a few optional, toggleable network requests
(backgrounds, quotes, update check). See [PRIVACY.md](PRIVACY.md).

## Attribution

This plugin is derived from
[obsidian-beautitab](https://github.com/andrewmcgivery/obsidian-beautitab) by
Andrew McGivery, used under the MIT License. Background images are served by
[Unsplash](https://unsplash.com); built-in online quotes come from the
[ZenQuotes](https://zenquotes.io) API.

<!-- doc-product:documentation:start -->
## Documentation

- [Installation](docs/installation.md)
- [Configuration](docs/configuration.md) — Generated from `src/Settings/Settings.ts`.
- [Usage](docs/usage.md)
- [Troubleshooting](docs/troubleshooting.md)
<!-- doc-product:documentation:end -->

## License

[MIT](LICENSE) © Marcus Breiden
