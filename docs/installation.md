# Installation

Install New Tab, confirm it loaded, and keep it up to date.

## Prerequisites

- **Obsidian 1.11.4 or newer.** The plugin declares this as its minimum app
  version; older versions will refuse to load it.
- **Desktop or mobile.** New Tab runs on both — there is no desktop-only
  restriction.

No account is required to install. Some background sources (themed and topic
backgrounds) need a free Unsplash access key, but that is set up later in
[Configuration](configuration.md) — it is not needed to install or to use a
local or transparent background.

## Install from Community Plugins

1. Open **Settings → Community plugins**.
2. If **Restricted mode** is on, turn it off.
3. Click **Browse**, then search for **New Tab**.
4. Pick the entry by **Marcus Breiden**, click **Install**, then **Enable**.

## Install manually

To run a pre-release build, install via **BRAT** (Beta Reviewers Auto-update
Tool):

1. Install and enable **BRAT** (`Obsidian42 - BRAT`) from Community Plugins.
2. Run the command **BRAT: Add a beta plugin** from the command palette.
3. Enter the repository `MMoMM-org/obsidian-newtab` and confirm.

BRAT installs the plugin and keeps it updated from the repository on each
Obsidian start.

## Verify the installation

Open a new tab — press **Ctrl/Cmd + T**, or click the **+** in the tab bar. The
empty tab is replaced automatically with the New Tab view (background, clock and
quote, and a search box). There is no command or ribbon icon to run — hijacking
the empty new-tab view is how the plugin works.

If a new tab stays empty or shows something else, confirm **New Tab** is listed
and enabled under **Settings → Community plugins**, and that no other "new tab"
plugin (such as BeautiTab) is enabled alongside it — see
[Troubleshooting](troubleshooting.md#new-tabs-show-a-different-page-or-nothing).

## Updating

- **Community Plugins:** open **Settings → Community plugins → Check for
  updates**, then update New Tab. Obsidian handles update notifications.
- **BRAT (pre-release):** BRAT updates beta plugins automatically on Obsidian
  start. To update on demand, run **BRAT: Check for updates to all beta
  plugins**.
