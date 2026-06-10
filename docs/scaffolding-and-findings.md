# Scaffolding & findings

Record of how this repo was created and the non-obvious decisions, gotchas, and
known issues found along the way. Written 2026-06-10.

## What this is

A personal version of [obsidian-beautitab](https://github.com/andrewmcgivery/obsidian-beautitab)
(MIT) — a customizable new-tab dashboard for Obsidian. It is a **hybrid**:
beautitab's React + SCSS source dropped onto the MiYo Obsidian-plugin build
pipeline (esbuild, semantic-release, CI with build-provenance attestation,
vitest, eslint-obsidianmd, stylelint browser-compat).

Decisions taken at creation:

- **Identity**: plugin id `newtab`, name `New Tab`. All inherited `Beautitab`/
  `beautitab` identifiers were renamed to `NewTab`/`newtab` (class, view-type
  string `newtab-react-view`, settings types, CSS class prefix `newtab-`).
- **Layout**: beautitab's original root layout is preserved (`main.ts`, `src/`,
  `React/`, `Views/`, `styles.scss`) with `tsconfig` `baseUrl: "."`. Its imports
  use bare specifiers (`main`, `React/...`, `src/...`) that resolve against
  `baseUrl`; relocating everything under a single `src/` would have broken them.
- **Lean / standalone**: this repo lives outside the MiYo tree, so the MiYo
  CLAUDE.md import chain, `_inbox/_outbox` handoff mesh, AGENTS.md, and
  `docs/ai/memory/` governance were intentionally **not** included.

## Build pipeline specifics

- **esbuild** (`esbuild.config.mjs`): two entry points (`main.ts` + `styles.scss`)
  with `esbuild-sass-plugin`, `jsx: "automatic"`, React/React-DOM bundled
  (not external). Dev build → repo root; prod build → `build/`. `DEPLOY_VAULT=1
  npm run build` mirrors a dev-version-stamped build into the `test/NewTab/`
  vault (which has hot-reload and `newtab` pre-enabled).
- **stylelint** runs against the **compiled** `build/styles.css`, not the SCSS
  source. The `no-unsupported-browser-features` plugin reads SCSS nesting as
  (partially-supported) native CSS nesting and false-positives; Sass flattens
  that away, so the compiled output is the correct — and the same artifact the
  Obsidian community bot checks. `npm run lint` therefore requires a build first
  (CI's lint job builds before linting).
- **Dependency pins**: `esbuild-sass-plugin@3.3.1` (its `>=0.20.1` esbuild peer
  keeps the blueprint's `esbuild@0.25.5` pin; newer plugin versions demand
  esbuild `>=0.27.x`). The plugin's Sass peer is `sass-embedded`, not `sass`.
- **Ambient stub** `types/electron.d.ts`: settings use Electron's legacy
  `remote.dialog` for the local-image picker. Electron is provided by the
  Obsidian desktop runtime (marked external in esbuild), so it is declared
  here rather than depending on the heavy `electron` package for types.

## Fork debt (eslint warnings)

beautitab's source predates and was not written against the blueprint's strict
`recommendedTypeChecked` rule set. To keep CI green without rewriting inherited
logic, the type-aware rules that fire en masse are downgraded to **warnings** in
`eslint.config.mts` (documented block) — `no-explicit-any`, `no-floating-promises`,
`no-deprecated` (`display()`), the `no-unsafe-*` family, `no-unsafe-enum-comparison`,
`prefer-window-timers`, `ui/sentence-case`, etc. As of creation: **0 errors,
~183 warnings**. Pay these down incrementally and promote rules back to `error`;
new code should not add to the list.

> ⚠️ Do **not** run `eslint --fix` blindly on this repo. The `no-explicit-any`
> fixer rewrites `any` → `unknown`, which then breaks `tsc` on the inherited
> source (e.g. `item.type` on an `unknown[]`). This was hit and reverted during
> scaffolding.

## Known issues / follow-ups

- **`isDesktopOnly: false`** is kept from upstream, but the settings code uses
  `electron` and `fs` (local backgrounds, native file picker) — desktop-only
  APIs. Set it to `true`, or guard those paths, before considering mobile.
- **`source.unsplash.com`** (used for themed backgrounds in
  `React/Utils/getBackground.ts`) was deprecated by Unsplash upstream; themed
  backgrounds may not load. Needs a replacement image source.
- **Version check** (`main.ts`) GETs `raw.githubusercontent.com/MMoMM-org/
  obsidian-newtab/{main,beta}/package.json`. The `beta` branch does not exist
  yet; that request simply returns non-200 and is ignored.
- `console.log` debug statements remain in `React/Utils/getBookmarks.ts` (from
  upstream) — surfaced as lint warnings.

## Dev environment (Docker)

claude-docker was set up with the **secure** variant
(`~/Kouzou/scripts/claude-docker-install.sh --yes`). The image
(`claude-code-secure:1.8`) builds on the first `./begin-code.sh` run. The Docker
artifacts (`claude-docker/`, `claude-docker-home/`, `begin-code.sh`) are
gitignored by design and are not part of this repo's history.

## Verification

```bash
npm install
npm run build      # tsc + esbuild → build/{main.js,styles.css,manifest.json}
npm run typecheck
npm test           # vitest
npm run lint       # eslint (0 errors) + stylelint on build/styles.css
```

Manual QA: `DEPLOY_VAULT=1 npm run build`, then open `test/NewTab/` as an
Obsidian vault.
