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

## Data sent

None of these requests include vault content, file paths, frontmatter, or any
personally identifying information. Background requests send the selected theme
tag plus your Unsplash access key (in the `Authorization` header, to Unsplash
only); quote requests send only a random-quote query.

## Local data

Settings (including any custom background paths and custom quotes) are stored in
the plugin's `data.json` inside your vault, managed by Obsidian. Your Unsplash
access key is kept in Obsidian's secret store, not in `data.json` — only the
secret's ID is saved in settings.

The resolved background image URL is cached in the browser's `localStorage`
(keyed per theme, per hour) so an open tab doesn't re-hit Unsplash on every
render. This is a per-device, throwaway cache — it holds only an image URL, is
re-derivable at any time, and is deliberately kept out of `data.json` so it is
never replicated by Obsidian Sync.

## Vault access

To build its widgets, New Tab reads your vault through the Obsidian API only:

- **Recent files** and **bookmarks** read Obsidian's own lists (recently opened
  files, the core Bookmarks plugin).
- **Vault-note quotes** and **local backgrounds**, when enabled, enumerate file
  paths in the vault (or a chosen folder) to find candidate notes/images, then
  read the matched files. This means the plugin can see your file paths — it is
  used solely to populate these two optional features and nothing is sent
  anywhere. Disable *Vault notes* (quotes) and use a non-Local background theme
  if you prefer it not to enumerate.
