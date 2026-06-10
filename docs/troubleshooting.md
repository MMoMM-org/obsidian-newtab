# Troubleshooting

If a background or quote isn't showing up, the plugin can log exactly what it's
doing to the developer console.

## Enable debug logging

1. **Settings → New tab → Debug settings → Debug logging** — turn it on.
2. Open the developer console: **Ctrl/Cmd + Shift + I → Console**.
3. Enable the **Verbose** log level in the console's level dropdown — `debug`
   messages are hidden otherwise.
4. **Open a new tab** (or change a background/quote setting) to trigger
   activity. Look for lines prefixed `[NewTab:background]` and `[NewTab:quote]`.

The toggle takes effect immediately — no need to restart Obsidian — but only
*new* actions produce log lines. If you turn it on while a new tab is already
open, open a fresh tab to see anything (the current one already resolved, and
the background is cached for the day).

The access key itself is never logged — only its length.

## Backgrounds don't load

Check the `[NewTab:background]` lines:

| Log line | Meaning | Fix |
|----------|---------|-----|
| `no Unsplash access key set` | No key configured. | Settings → Background → **Unsplash access key**. Create a free app at [unsplash.com/oauth/applications](https://unsplash.com/oauth/applications) and paste its key. |
| `status 401` / `invalid access token` | The stored key is wrong. | Copy the **Access Key** (~43 chars), *not* the **Secret key** and *not* the numeric **Application ID**. The log shows `keyLength=` to sanity-check — 8 characters usually means you grabbed the Application ID. |
| `status 403` | Rate limit reached. | The Unsplash demo tier allows 50 requests/hour. The image is cached per day, so normal use stays well under it — wait an hour. |
| `200 OK but no urls.regular` | Unexpected response. | Transient; try again later. |

A *themed* background (Seasons and Holidays, Custom topic, …) needs an access
key. **Local** images, a **Custom** URL, and the **transparent** themes don't —
use one of those for a fully offline background.

## Quotes don't load

Check the `[NewTab:quote]` lines. ZenQuotes is key-free; on any failure
(offline, non-200, or its rate-limit sentinel) the plugin falls back to your
custom quotes silently — you won't get a console error. To stay fully offline,
set the quote source to **My quotes**.

## "Update available" notice

On load the plugin checks GitHub for a newer version. On a private repository
the check is skipped silently and never blocks anything.

## The settings dialog looked broken when I disabled the plugin

Fixed — update to the latest build.
