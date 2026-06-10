# Privacy

New Tab is **local-first**. Your vault content, settings, and bookmarks never
leave your machine. The plugin makes a small number of **outbound network
requests**, all optional and all toggleable from the settings tab. No
telemetry, analytics, or crash reporting is collected.

## Network surfaces

| Host | Purpose | When | How to disable |
|------|---------|------|----------------|
| `source.unsplash.com` | Fetches a random background image for the configured theme. | On opening the New Tab view, when a non-local background theme is selected. | Choose a **local** or **custom** background, or a transparent theme. |
| `api.quotable.io` | Fetches a random quote (via Obsidian's `requestUrl`). | On opening the New Tab view, when the quote source is set to *Quotable*. | Turn off **Show quote**, or set the quote source to your own **custom quotes**. |
| `raw.githubusercontent.com` | Version check: compares the installed version against `package.json` on the repo's `main`/`beta` branch to notify about updates. | Once, on plugin load. | — (metadata-only request to the public repo; no vault data is sent). |

## Data sent

None of these requests include vault content, file paths, frontmatter, or any
personally identifying information. Background and quote requests send only the
selected theme tag / a random-quote query string. The version check is a plain
GET of a public file.

## Local data

Settings (including any custom background paths and custom quotes) are stored in
the plugin's `data.json` inside your vault, managed by Obsidian.
