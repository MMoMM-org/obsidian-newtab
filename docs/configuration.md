# Configuration

All settings for New Tab live in the plugin's settings tab and apply immediately
as you change them. They're organized into tabs — one per element
(**Background**, **Search**, **Time**, **Greeting**, **Recent files**,
**Bookmarks**, **Quote**), plus **Styles** and **Debug**.

## How to open settings

Open **Settings → Community plugins → New Tab** (gear icon), or **Settings → New
tab** in the left settings sidebar. Pick a tab along the top; changes take effect
at once — open a new tab to see them.

## Settings reference

Some rows are **conditional** — they only appear in the settings panel when a
related option is selected (noted in the description). Each element's tab also
ends with an **applied style** dropdown — see [Text styles](#styles).

### Background

<p align="center">
  <img src="../assets/settings-background.png" alt="The NewTab settings tab, showing the background settings and the plugin header" />
</p>

| Setting | Default | Description |
|---|---|---|
| Background theme | `Seasons and holidays` | Theme for the random background. **Seasons and holidays** varies by time of year; the fixed subjects **Winter, Spring, Summer, Fall, Mountains, Lakes, Forest, Animals** each always pull that subject; **Custom topic** uses your own search term; **Custom** lets you supply a URL; **Local** uses imported images; **Transparent** and **Transparent with shadows** show your Obsidian theme. The first ten (Seasons and holidays, the eight fixed subjects, and Custom topic) are Unsplash-backed and need an access key. |
| Unsplash access key | _(unset)_ | Required for the Unsplash-backed themes. Create a free app at [unsplash.com/oauth/applications](https://unsplash.com/oauth/applications) and paste its access key. Stored securely outside `data.json`. Shown only for Unsplash-backed themes. |
| Custom topic | `""` | Search term(s) used to pick a random Unsplash photo, e.g. "ocean sunset". Shown only when the theme is "Custom topic". |
| Custom background URL | `""` | The URL to use for the background image. Shown only when the theme is "Custom". |
| Background image folder | `""` | When the theme is "Local", a random image from this vault folder (and subfolders) is shown. |

> The **Transfer local image to vault** button (Background section) copies an
> image from your device into the background folder so it joins the rotation —
> it is an action, not a stored setting.

<p align="center">
  <img src="../assets/settings-background-themes.png" alt="The background theme dropdown listing every available theme" />
</p>

### Search

<p align="center">
  <img src="../assets/settings-search.png" alt="The Search settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show top left search button | `true` | Show the search button at the top-left of the new tab. |
| Top left search provider | `Obsidian Core Quick Switcher` | Which plugin handles search from the top-left button. Supports the core Quick Switcher, Omnisearch, Switcher++, and Another Quick Switcher. |
| Show navigation buttons | `true` | Show back and forward buttons at the top of the new tab, so you can navigate forward again after pressing back lands you here. |
| Show inline search | `true` | Show the inline search box in the middle of the new tab. |
| Inline search provider | `Obsidian Core Quick Switcher` | Which plugin handles search from the inline box. |

### Time

<p align="center">
  <img src="../assets/settings-time.png" alt="The Time settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show time | `true` | Show the clock in the middle of the new tab. |
| Time format | `12-hour` | Display the time in 12-hour or 24-hour format. |



### Greeting

<p align="center">
  <img src="../assets/settings-greeting.png" alt="The Greeting settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show greeting | `true` | Show the greeting in the middle of the new tab. |
| Greeting text | `Hello, Beautiful.` | The greeting text. Use the `{{greeting}}` token to insert a time-of-day greeting (e.g. "Good morning"), and markdown like `**bold**` or `*italic*` for emphasis. |
| Greeting language | `Auto (follow Obsidian)` | Language for the `{{greeting}}` phrase. "Auto" follows Obsidian's display language; pick a specific language to greet in a different one. |

### Recent files

<p align="center">
  <img src="../assets/settings-recentfiles.png" alt="The Recent files settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show recent files | `true` | Show recently opened files in the middle of the new tab. |


### Bookmarks

<p align="center">
  <img src="../assets/settings-bookmarks.png" alt="The Bookmarks settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show bookmarks | `false` | Show bookmarks in the middle of the new tab. |
| Bookmarks source | `All bookmarks` | Show all bookmarks, or only those from a specific group. |
| Bookmarks group | `""` | Which bookmark group to pull from. Shown only when the source is "Bookmarks from group". |

### Quote

<p align="center">
  <img src="../assets/settings-quote.png" alt="The Quote settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Show quote | `true` | Show the quote at the bottom of the new tab. |
| Online quotes | `true` | Random quotes from ZenQuotes (requires an internet connection). |
| My quotes | `false` | Your own quotes, stored in the plugin settings (edited via the "Edit" button). |
| Vault notes | `false` | Use quotes stored in your notes' frontmatter, selected by tag or folder. |
| Note selection | `Tag` | Find quote notes by tag or by folder. Shown only when "Vault notes" is on. |
| Tag | `type/note/quote` | Notes carrying this tag (frontmatter or inline) are used as quotes. Shown only in tag mode. |
| Folder | `""` | Notes in this folder and its subfolders are used as quotes. Shown only in folder mode. |
| Quote property | `Quote` | Frontmatter property holding the quote text. Shown in vault-notes mode. |
| Author property | `Author` | Frontmatter property holding the author. Shown in vault-notes mode. |

> Quotes are drawn from the **union** of whichever sources are enabled. If a
> source fails (e.g. offline ZenQuotes), the plugin falls back to the others.

### Styles

The **Styles** tab is where you create reusable *text styles* and the rest of
the tabs decide which style each element uses.

<p align="center">
  <img src="../assets/settings-styles.png" alt="The Styles settings tab, with the collapsible style editors" />
</p>

A **text style** bundles five properties; each has a neutral value that leaves
the current look untouched, so the built-in **Default** style reproduces the
original appearance exactly:

| Property | Default | Description |
|---|---|---|
| Font | _(theme font)_ | A font family. Type any installed font, or start typing to pick from your system fonts with a live preview (desktop; free-text on mobile). Empty inherits the theme font. |
| Size | `100%` | A percentage of the element's normal size, so each element scales from its own baseline (the quote keeps its line proportions). |
| Weight | `Default` | Normal, Medium, Semibold, or Bold. "Default" keeps the element's built-in weight. |
| Italic | `false` | Render the text in italics. |
| Color | _(inherit)_ | A text color, or reset to inherit the theme's color. |

- **Add style** creates a new style; each style is a collapsible block. The
  **Default** style can't be deleted, but it has a reset button — and editing it
  is a quick way to restyle every element at once.
- To apply a style, open the element's own tab (Time, Greeting, …) and pick it
  in that tab's **applied style** dropdown. Deleting a style returns anything
  using it to Default.

### Debug

<p align="center">
  <img src="../assets/settings-debug.png" alt="The Debug settings tab" />
</p>

| Setting | Default | Description |
|---|---|---|
| Debug logging | `false` | Log background and quote provider activity to the developer console. Leave off unless troubleshooting — see [Troubleshooting](troubleshooting.md). Takes effect immediately. |



## Tips

- For a fully **offline** new tab, set the background theme to **Local**,
  **Custom** (URL), or **Transparent**, and set the quote source to **My
  quotes** — neither needs network access or an Unsplash key.
- The search and quote providers reuse plugins you already have installed; New
  Tab does not bundle its own search index.
