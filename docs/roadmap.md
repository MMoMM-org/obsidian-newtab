# Roadmap & upstream triage

Triage of the [obsidian-beautitab](https://github.com/andrewmcgivery/obsidian-beautitab)
(MIT) upstream issues/PRs against this personal fork, plus our own planned work.
Written 2026-06-10. See also [scaffolding-and-findings.md](./scaffolding-and-findings.md).

## Upstream status: effectively abandoned

Last code push to the upstream default branch was **March 2024**; no PR has been
merged in ~2 years and all open upstream PRs (incl. the 2026 Unsplash fix #79) are
unmerged. Upstream issue #71 ("What is the status of this plugin?") confirms this.

**Implication:** we do not contribute back — we cherry-pick what's useful and fix
the rest in this fork. Upstream issue numbers below are kept only for traceability.

## External-service decisions

| Concern | Old (dead) | New | Notes |
|---|---|---|---|
| Backgrounds | `source.unsplash.com/random` → 503 since 2024 | **Unsplash official API** (`/photos/random?query=`) | Free: 50 req/h demo, 5000/h after approval. Access Key in **SecretStorage**, not `data.json`. Cache the daily image to stay under the limit. |
| Quotes | `api.quotable.io` → domain dead | **ZenQuotes** (`/api/random`) | Key-free; attribution required. Graceful fallback to custom quotes when offline. |

The picsum.photos stopgap (upstream PR #79) was rejected — it loses topic matching,
making seasonal themes meaningless.

## Scope — current round

Tracked as GitHub issues #1–#8 in this repo (standalone, **not** on the MiYo board).

### 🔴 Bitrot (real bugs, affect everyone)
- **#1** — Quotes dead (`getQuote.ts`) → ZenQuotes + error handling. _(upstream #61 #69 #75 #56)_ — **first up**
- **#2** — Backgrounds dead (`getBackground.ts`) → Unsplash API + SecretStorage key, topic/custom topics, local-folder fallback. _(upstream #54 #58 #77, rejects PR #79)_

### 🟡 UX bugs
- **#3** — First character / IME swallowed in new tab (focus timing). _(upstream #41 #73)_
- **#4** — "Recent files" not actually recent (`getBookmarks.ts`). _(upstream #66)_
- **#5** — New note should replace the NewTab view, not open beside it. _(upstream #70)_

### 🟡 Architecture
- **#6** — Vault images as file path instead of base64 in `data.json`. **No migration** (new plugin, no existing users); enables folder randomization. _(upstream #67 #52 #60 #58)_

### 🟢 Own / to review
- **#7** — Quotes from vault notes. **Blocked on spec** (source format, callout vs markdown quote, tag filter). _(upstream #35)_
- **#8** — Tooltips for long file/bookmark names. _(upstream #59 — to review)_
- Upstream **PR #55** (debug logging) / **PR #62** (typo) — to review; note we want `console.log` *removed*, not added.

## Deliberately out of scope / moot for this fork

- Upstream **#71** (status question) — N/A.
- Upstream **#30 / #48** (update-notification annoyance) — our version check points at the
  real `MMoMM-org/obsidian-newtab` repo and is legitimate for a published plugin; the
  only gap is the missing `beta` branch (its 404 is already ignored). **Keep**, optionally
  tidy the beta-branch handling later.

## Backlog (unscheduled feature requests)

Light/dark background pair (#74) · configurable recent/bookmark counts (#42) ·
configurable date/time field (#46) · back/forward nav buttons (#78) · set as
homepage (#49) · today's tasks (#26) · workspaces (#68). Pull into a round only
on demand.
