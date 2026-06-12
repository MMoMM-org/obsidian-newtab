# BeautiTab → New Tab one-time import — implementation plan & handoff

Tracking issue: **#17** (Build a one-time import of BeautiTab settings into New Tab).
Branch: `feat/17-beautitab-import`.

This is a session handoff. The research below was done from a Docker sandbox that
**cannot read the user's real vaults**. The one open verification step (inspect a
real `1.6.2-7` `data.json`) must be done in a non-Docker session — see
[Open verification](#open-verification).

---

## Goal

When a user who already runs **BeautiTab** installs New Tab, offer a **one-time,
opt-in, non-destructive** import that copies their BeautiTab configuration into
New Tab so they don't have to reconfigure by hand.

Confirmed decisions (from the user):
- **Trigger:** first-run notice — on load, detect BeautiTab `data.json`; if present
  and not yet offered, show a one-time notice/modal. Persist a `beautitabImportOffered`
  flag so it only appears once.
- **Local images:** let the user pick the target vault folder during import
  (FolderSuggest).
- **Must support BOTH BeautiTab variants** (see below). The user runs the Mara-Li
  fork (hard to find), but the original is also in the wild.

---

## The two BeautiTab variants

Both use plugin **id `beautitab`**, so the data path is the same:
`<configDir>/plugins/beautitab/data.json` (`configDir` = `app.vault.configDir`,
usually `.obsidian`).

### A. Original — andrewmcgivery/obsidian-beautitab (≤ 1.6.1)

18 persisted keys. Source of truth: the actual `data.json` in the repo test vault
at `test/NewTab/.obsidian/plugins/beautitab/data.json` (this is the **original**
schema — it has no `apiKey`).

### B. Fork — Mara-Li/obsidian-beautitab (the user's actual build)

The maintained fork. User has **`1.6.2-7`** (a beta tag; BRAT-installed). Schema at
tag `1.6.2-7` == fork `main` (1.6.1): the 18 original keys **plus**:
- `apiKey: string` — the **Unsplash access key, stored in plaintext** (added in
  fork PR andrewmcgivery#57). Default `""`.
- `cachedBackground?: CachedBackground` — transient background cache. **Ignore on
  import.**

Enums are **identical across all variants** (verified at andrew main, fork main,
fork tag 1.6.2-7).

### Full BeautiTab schema (superset)

```ts
interface BeautitabPluginSettings {
  backgroundTheme: BackgroundTheme;      // "winter", "seasons and holidays", ...
  customBackground: string;              // URL
  localBackgrounds: string[];            // base64 data-URI images, stored INLINE
  showTopLeftSearchButton: boolean;
  topLeftSearchProvider: SearchProvider; // { command, display } — identical to New Tab
  showTime: boolean;
  timeFormat: TIME_FORMAT;               // "12-hour" | "24-hour"
  showGreeting: boolean;
  greetingText: string;                  // "Hello, Beautiful."
  showInlineSearch: boolean;
  inlineSearchProvider: SearchProvider;
  showRecentFiles: boolean;
  showBookmarks: boolean;
  bookmarkSource: BOOKMARK_SOURCE;       // "all" | "group"
  bookmarkGroup: string;
  showQuote: boolean;
  quoteSource: QUOTE_SOURCE;             // "Quoteable" | "My quotes" | "Both"
  customQuotes: CustomQuote[];           // { text, author } — identical to New Tab
  apiKey: string;                        // FORK ONLY — Unsplash key (plaintext)
  cachedBackground?: CachedBackground;   // FORK ONLY — transient, ignore
}
```

Enums (BeautiTab):
- `BackgroundTheme`: seasons and holidays, winter, spring, summer, fall, mountains,
  lakes, forest, animals, custom, local, transparent, transparent with shadows.
  (New Tab is a **superset** — adds `custom topic`. Every BeautiTab theme is valid
  in New Tab, so `backgroundTheme` copies directly.)
- `TIME_FORMAT`: 12-hour, 24-hour.
- `BOOKMARK_SOURCE`: all, group.
- `QUOTE_SOURCE`: Quoteable, My quotes, Both.

---

## Field mapping → New Tab (`NewTabPluginSettings`, `src/Settings/Settings.ts`)

**Direct copy (same name, type, semantics):**
`backgroundTheme`, `customBackground`, `showTopLeftSearchButton`,
`topLeftSearchProvider`, `showTime`, `timeFormat`, `showGreeting`, `greetingText`,
`showInlineSearch`, `inlineSearchProvider`, `showRecentFiles`, `showBookmarks`,
`bookmarkSource`, `bookmarkGroup`, `showQuote`, `customQuotes`.

**Transformed:**

| BeautiTab | New Tab | Rule |
|---|---|---|
| `localBackgrounds: string[]` (base64) | `localBackgroundFolder: string` | Decode each data-URI, sniff **magic bytes** for the real format (the URIs are mislabelled `image/png` but the bytes are JPEG `/9j/`), write each to the user-chosen vault folder, set `localBackgroundFolder` to that folder. |
| `quoteSource: "Quoteable"` | `quoteUseOnline = true` | New Tab's existing `migrateQuoteSources` does NOT cover `"Quoteable"` (it only knows `"Online quotes"`). Import must map it explicitly. |
| `quoteSource: "My quotes"` | `quoteUseMyQuotes = true` | |
| `quoteSource: "Both"` | `quoteUseOnline = true; quoteUseMyQuotes = true` | |
| `apiKey: string` (non-empty) | SecretStorage + `unsplashKeySecretId` | Store the raw key in Obsidian SecretStorage under a generated id (e.g. `"Unsplash access key (imported from Beautitab)"`), set `unsplashKeySecretId` to that id. Empty → leave New Tab default (unset). FORK ONLY. |
| `cachedBackground` | — | Ignore (transient cache). |

**New-Tab-only fields left at default** (no BeautiTab source):
`customTopic`, `greetingLanguage`, `quoteUseVaultNotes`, `quoteVaultSelectionMode`,
`quoteVaultTag`, `quoteVaultFolder`, `quoteVaultContentProperty`,
`quoteVaultAuthorProperty`, `debugLogging`. (And `unsplashKeySecretId` when no
`apiKey`.)

**Robustness:** read each known key defensively with a fallback to the New Tab
default; ignore unknown keys. This makes the import work for the 18-key original
AND the 20-key fork from one code path.

---

## Implementation plan (TDD)

1. **`src/Import/beautitab.ts`** (or similar):
   - `BEAUTITAB_PLUGIN_ID = "beautitab"`.
   - `readBeautitabData(app): Promise<Record<string, unknown> | null>` — read
     `${app.vault.configDir}/plugins/beautitab/data.json` via `app.vault.adapter`;
     return `null` if absent/unparseable.
   - `mapBeautitabSettings(raw): Partial<NewTabPluginSettings>` — **pure, fully
     unit-tested.** Direct copies + `quoteSource`→toggles + apiKey passthrough flag.
     Does NOT touch the filesystem or SecretStorage (those are side effects handled
     by the orchestrator). Return a structured result that also reports: list of
     base64 images to extract, and the raw apiKey (if any), so the orchestrator can
     do the IO.
   - `extractLocalBackgrounds(app, dataUris, folder): Promise<string[]>` — decode,
     sniff magic bytes (JPEG/PNG/WebP/GIF), `vault.createBinary` into `folder`,
     return written paths. Use `normalizePath`.
   - `importFromBeautitab(plugin, folder)` — orchestrate: read → map → extract
     images → store apiKey in SecretStorage → merge into `plugin.settings`
     **non-destructively** → `saveSettings()`.
2. **First-run detection** in `main.ts onload()`: after `loadSettings`, if
   `!settings.beautitabImportOffered` and `readBeautitabData` returns non-null,
   show a `Notice`/modal. Add `beautitabImportOffered: boolean` to
   `NewTabPluginSettings` + `DEFAULT_SETTINGS` (default `false`); set `true` once
   offered (regardless of accept/decline) and save.
3. **Confirm modal** (extend the existing modal pattern in `src/ConfirmModal/`):
   summary of what will be imported + FolderSuggest for the image target folder +
   Apply / Cancel. Non-destructive; require explicit confirm.
4. **Tests** (vitest): pure-mapping tests using two fixtures —
   (a) the real original `data.json` from the test vault (strip the huge base64
   for the fixture), and (b) a fork fixture with `apiKey` + `cachedBackground`.
   Assert quoteSource mapping, apiKey passthrough, direct copies, and that
   New-Tab-only fields stay at default.
5. **Post-import notice:** if the resulting `backgroundTheme` is an Unsplash-backed
   theme AND no key was imported, tell the user they must add their own Unsplash
   key (see `docs/configuration.md` → Background).
6. **`docs/migration.md`** + README link (issue #17 AC). Document: settings do not
   auto-import silently; the import is offered once and is opt-in; what carries over
   and what doesn't (Unsplash key only from the Mara-Li fork; vault-note quotes are
   New-Tab-only).

---

## Open verification (do this first in the non-Docker session)

Inspect a **real `1.6.2-7` `data.json`** from one of the user's actual vaults to
confirm value-level serialization, especially:
- Is `apiKey` present and how is it serialized when set vs empty?
- How big does `cachedBackground` get, and what shape is it? (Confirm we ignore it.)
- Confirm `localBackgrounds` is still inline base64 in the real file.

The user's vaults are outside this repo (somewhere under `/Volumes/Moon/...`).
The repo test vault (`test/NewTab/.obsidian/plugins/beautitab/data.json`) is the
**original** schema, useful as the 18-key fixture but NOT for the fork's `apiKey`.

---

## References

- Original: https://github.com/andrewmcgivery/obsidian-beautitab
- Fork (user's build): https://github.com/Mara-Li/obsidian-beautitab — tag `1.6.2-7`
- Fork apiKey origin: andrewmcgivery/obsidian-beautitab PR #57 (merged into fork 1.6.2)
- New Tab settings: `src/Settings/Settings.ts` (`NewTabPluginSettings`,
  `DEFAULT_SETTINGS`, `migrateQuoteSources`); `src/Types/Interfaces.ts`
  (`CustomQuote`, `SearchProvider`); `src/Types/Enums.ts`.
- New-tab hijack / load: `main.ts` `onload`, `onLayoutChange`.

## Related follow-up

A separate issue tracks evaluating/porting Mara-Li's other fork fixes (i18n via
i18next, reliable hourly background change, background caching, etc.) into New Tab.
