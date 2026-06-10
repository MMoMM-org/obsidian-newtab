import { requestUrl } from "obsidian";
import { BackgroundTheme } from "src/Types/Enums";
import getEasterDate from "./getEasterDate";
import { isWithinDaysBefore } from "./isWithinXDays";
import { debugLog } from "./debug";

enum MONTH {
	JANUARY = 1,
	FEBUARY = 2,
	MARCH = 3,
	APRIL = 4,
	MAY = 5,
	JUNE = 6,
	JULY = 7,
	AUGUST = 8,
	SEPTEMBER = 9,
	OCTOBER = 10,
	NOVEMBER = 11,
	DECEMBER = 12,
}

enum SEASONAL_THEME {
	WINTER = "winter",
	NEW_YEARS = "fireworks",
	GROUNDHOG_DAY = "groundhog",
	VALENTINES_DAY = "valentine",
	WOMENS_DAY = "womensday",
	ST_PATRICS_DAY = "pub",
	PI_DAY = "pie",
	EASTER = "easter",
	APRIL_FOOLS = "laughing",
	SPRING = "spring",
	EARTH_DAY = "earth",
	STARWARS = "yoda",
	CINCO_DE_MAYO = "mexico",
	SUMMER = "summer",
	FLAG_DAY = "america,flag",
	JUNETEENTH = "juneteenth",
	INDIGENOUS_PEOPLES_DAY = "firstnations",
	CANADA_DAY = "fireworks",
	JULY_FIRST = "fireworks",
	FALL = "fall",
	HALLOWEEN = "helloween",
	REMEMBERANCE_DAY = "veteran",
	CHRISTMAS = "christmas",
}

/**
 * Given a date, returns a seasonal tag for use in background generation
 * @param date
 */
const getSeasonalTag = (date: Date) => {
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const year = date.getFullYear();

	// Easter is an edge case cause it's a silly calculation
	const easter = getEasterDate(year);
	if (isWithinDaysBefore(date, 5, easter)) {
		return SEASONAL_THEME.EASTER;
	}

	switch (month) {
		case MONTH.JANUARY:
			return day === 1 ? SEASONAL_THEME.NEW_YEARS : SEASONAL_THEME.WINTER;
		case MONTH.FEBUARY:
			switch (day) {
				case 2:
					return SEASONAL_THEME.GROUNDHOG_DAY;
				case 14:
					return SEASONAL_THEME.VALENTINES_DAY;
				default:
					return SEASONAL_THEME.WINTER;
			}
		case MONTH.MARCH:
			switch (day) {
				case 8:
					return SEASONAL_THEME.WOMENS_DAY;
				case 14:
					return SEASONAL_THEME.PI_DAY;
				case 17:
					return SEASONAL_THEME.ST_PATRICS_DAY;
				default:
					return SEASONAL_THEME.WINTER;
			}
		case MONTH.APRIL: {
			switch (day) {
				case 1:
					return SEASONAL_THEME.APRIL_FOOLS;
				case 22:
					return SEASONAL_THEME.EARTH_DAY;
				default:
					return SEASONAL_THEME.SPRING;
			}
		}
		case MONTH.MAY: {
			switch (day) {
				case 4:
					return SEASONAL_THEME.STARWARS;
				case 5:
					return SEASONAL_THEME.CINCO_DE_MAYO;
				default:
					return SEASONAL_THEME.SPRING;
			}
		}
		case MONTH.JUNE: {
			switch (day) {
				case 14:
					return SEASONAL_THEME.FLAG_DAY;
				case 19:
					return SEASONAL_THEME.JUNETEENTH;
				case 21:
					return SEASONAL_THEME.INDIGENOUS_PEOPLES_DAY;
				default:
					return SEASONAL_THEME.SUMMER;
			}
		}
		case MONTH.JULY: {
			switch (day) {
				case 1:
					return SEASONAL_THEME.CANADA_DAY;
				case 4:
					return SEASONAL_THEME.JULY_FIRST;
				default:
					return SEASONAL_THEME.SUMMER;
			}
		}
		case MONTH.AUGUST: {
			return SEASONAL_THEME.SUMMER;
		}
		case MONTH.SEPTEMBER: {
			return SEASONAL_THEME.SUMMER;
		}
		case MONTH.OCTOBER:
			return day === 31 ? SEASONAL_THEME.HALLOWEEN : SEASONAL_THEME.FALL;
		case MONTH.NOVEMBER:
			return day === 11
				? SEASONAL_THEME.REMEMBERANCE_DAY
				: SEASONAL_THEME.FALL;
		case MONTH.DECEMBER:
			return day === 31
				? SEASONAL_THEME.NEW_YEARS
				: SEASONAL_THEME.CHRISTMAS;
	}
};

const UNSPLASH_CACHE_PREFIX = "newtab:unsplash:";

/**
 * Today as YYYY-MM-DD, used as the cache bucket so a themed background stays
 * stable for the day (matching the old per-day `cachetag` behaviour) and we
 * make at most one API call per tag per day — well under the 50/hour demo limit.
 */
const todayStamp = (): string => new Date().toISOString().slice(0, 10);

const readCache = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeCache = (key: string, value: string): void => {
	try {
		// Drop stale entries from previous days so the cache stays bounded.
		const today = todayStamp();
		for (let i = window.localStorage.length - 1; i >= 0; i--) {
			const k = window.localStorage.key(i);
			if (
				k &&
				k.startsWith(UNSPLASH_CACHE_PREFIX) &&
				!k.endsWith(`:${today}`)
			) {
				window.localStorage.removeItem(k);
			}
		}
		window.localStorage.setItem(key, value);
	} catch {
		// localStorage may be unavailable or full — caching is best-effort.
	}
};

/**
 * Resolve a themed background image URL via the official Unsplash API
 * (source.unsplash.com was deprecated and now 503s). Results are cached per tag
 * per day. Returns null when there is no cached image and no access key, or on
 * any API/network failure, so the caller can fall back to no background.
 */
const fetchUnsplashBackground = async (
	query: string,
	accessKey: string | null
): Promise<string | null> => {
	const cacheKey = `${UNSPLASH_CACHE_PREFIX}${query}:${todayStamp()}`;

	const cached = readCache(cacheKey);
	if (cached) {
		debugLog("background", `cache hit for "${query}" — using today's image`);
		return cached;
	}

	// Trim so a stray newline/space from copy-pasting the key can't turn into
	// a 401 "invalid access token".
	const key = accessKey?.trim();
	if (!key) {
		debugLog(
			"background",
			`no Unsplash access key set — no image. Add one in Settings → Background (query was "${query}").`
		);
		return null;
	}

	const endpoint = `https://api.unsplash.com/photos/random?orientation=landscape&query=${encodeURIComponent(
		query
	)}`;

	try {
		debugLog(
			"background",
			`requesting Unsplash for "${query}" (keyLength=${key.length})`,
			endpoint
		);
		const res = await requestUrl({
			url: endpoint,
			headers: { Authorization: `Client-ID ${key}` },
			throw: false,
		});

		const remaining = res.headers?.["x-ratelimit-remaining"];
		debugLog(
			"background",
			`Unsplash responded status ${res.status}` +
				(remaining ? `, ratelimit-remaining ${remaining}` : "")
		);

		if (res.status !== 200) {
			// 401 = invalid/missing access key, 403 = rate limit exhausted,
			// 404 = no photo for that query. The body carries Unsplash's reason.
			debugLog(
				"background",
				`non-200 from Unsplash (${res.status}) — no image. Body:`,
				res.text
			);
			return null;
		}

		const url = (res.json as { urls?: { regular?: string } })?.urls
			?.regular;
		if (!url) {
			debugLog(
				"background",
				"200 OK but no urls.regular in the response — no image. Body:",
				res.json
			);
			return null;
		}

		debugLog("background", `resolved image for "${query}"`, url);
		writeCache(cacheKey, url);
		return url;
	} catch (error) {
		debugLog("background", "request threw (network/offline?) — no image", error);
		return null;
	}
};

/**
 * Gets the background URL based on the theme settings: a themed/seasonal photo
 * from Unsplash, a custom URL, a random local image, or none (transparent).
 * @param backgroundTheme
 * @param customBackground
 * @param localBackgrounds
 * @param unsplashAccessKey resolved from SecretStorage; null when not set
 */
const getBackground = async (
	backgroundTheme: BackgroundTheme,
	customBackground: string,
	customTopic: string,
	localBackgrounds: string[],
	unsplashAccessKey: string | null
): Promise<string | null> => {
	debugLog(
		"background",
		`resolving theme="${backgroundTheme}", hasKey=${Boolean(
			unsplashAccessKey
		)}, customTopic="${customTopic}"`
	);
	switch (backgroundTheme) {
		case BackgroundTheme.SEASONS_AND_HOLIDAYS:
			return fetchUnsplashBackground(
				getSeasonalTag(new Date()) ?? SEASONAL_THEME.SUMMER,
				unsplashAccessKey
			);
		case BackgroundTheme.CUSTOM_TOPIC:
			return customTopic.trim()
				? fetchUnsplashBackground(customTopic.trim(), unsplashAccessKey)
				: null;
		case BackgroundTheme.CUSTOM:
			return customBackground;
		case BackgroundTheme.LOCAL:
			return localBackgrounds.length
				? localBackgrounds[
						Math.floor(Math.random() * localBackgrounds.length)
				  ]
				: null;
		case BackgroundTheme.TRANSPARENT_WITH_SHADOWS:
		case BackgroundTheme.TRANSPARENT:
			return null;
		default:
			return fetchUnsplashBackground(backgroundTheme, unsplashAccessKey);
	}
};

export default getBackground;
