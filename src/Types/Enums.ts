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
