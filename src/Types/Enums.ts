export enum BackgroundTheme {
	SEASONS_AND_HOLIDAYS = "seasons and holidays",
	WINTER = "winter",
	SPRING = "spring",
	SUMMER = "summer",
	FALL = "fall",
	MOUNTAIN = "mountains",
	LAKES = "lakes",
	FOREST = "forest",
	ANIMALS = "animals",
	CUSTOM_TOPIC = "custom topic",
	CUSTOM = "custom",
	LOCAL = "local",
	TRANSPARENT = "transparent",
	TRANSPARENT_WITH_SHADOWS = "transparent with shadows",
}

export enum TIME_FORMAT {
	TWELVE_HOUR = "12-hour",
	TWENTY_FOUR_HOUR = "24-hour",
}

export enum BOOKMARK_SOURCE {
	ALL = "all",
	GROUP = "group",
}

/**
 * Legacy single-source selector. Superseded by the per-source toggles
 * (quoteUseOnline / quoteUseMyQuotes / quoteUseVaultNotes); kept only so old
 * data.json values can be migrated on load. See migrateQuoteSources.
 */
export enum QUOTE_SOURCE {
	ONLINE = "Online quotes",
	MY_QUOTES = "My quotes",
	BOTH = "Both",
}

/** How vault notes are selected as quote sources. */
export enum VAULT_QUOTE_SELECTION {
	TAG = "tag",
	PATH = "path",
}

/**
 * Font weight options for a text style. INHERIT means "don't override" — the
 * element keeps whatever weight the stylesheet already gives it, which is how
 * the built-in Default style preserves the current look (e.g. the quote's 500).
 * The other values are CSS font-weight numbers.
 */
export enum FONT_WEIGHT {
	INHERIT = "",
	NORMAL = "400",
	MEDIUM = "500",
	SEMIBOLD = "600",
	BOLD = "700",
}

/**
 * The text elements a style can be assigned to. Each value matches the
 * NewTabPluginSettings.styleAssignments key and is used to resolve the CSS
 * variables applied to that element's container in the view.
 */
export enum STYLE_TARGET {
	TIME = "time",
	GREETING = "greeting",
	RECENT_FILES = "recentFiles",
	BOOKMARKS = "bookmarks",
	SEARCH = "search",
	QUOTE = "quote",
}
