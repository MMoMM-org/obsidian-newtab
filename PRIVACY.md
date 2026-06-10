# Privacy

New Tab is **local-first**. Your vault content, settings, and bookmarks never
leave your machine. The plugin makes a small number of **outbound network
requests**, all optional and all toggleable from the settings tab. No
telemetry, analytics, or crash reporting is collected.

## Network surfaces

| Host | Purpose | When | How to disable |
|------|---------|------|----------------|
| `api.unsplash.com` | Fetches a random background image for the configured theme, authenticated with your Unsplash access key. | On opening the New Tab view, when a themed (Unsplash) background is selected and an access key is configured. | Choose a **local** or **custom** background, or a transparent theme. |
| `zenquotes.io` | Fetches a random quote (via Obsidian's `requestUrl`). | On opening the New Tab view, when the quote source is set to *Online quotes* (or *Both*). | Turn off **Show quote**, or set the quote source to your own **custom quotes**. |
| `raw.githubusercontent.com` | Version check: compares the installed version against `package.json` on the repo's `main`/`beta` branch to notify about updates. | Once, on plugin load. | — (metadata-only request to the public repo; no vault data is sent). |

## Data sent

None of these requests include vault content, file paths, frontmatter, or any
personally identifying information. Background requests send the selected theme
tag plus your Unsplash access key (in the `Authorization` header, to Unsplash
only); quote requests send only a random-quote query. The version check is a
plain GET of a public file.

## Local data

Settings (including any custom background paths and custom quotes) are stored in
the plugin's `data.json` inside your vault, managed by Obsidian. Your Unsplash
access key is kept in Obsidian's secret store, not in `data.json` — only the
secret's ID is saved in settings.
