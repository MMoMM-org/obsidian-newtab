/**
 * Time-of-day greetings, per language.
 *
 * To add a language: add one entry to GREETINGS (key = the locale code Obsidian
 * reports for its display language, e.g. "de", "zh") plus a matching label in
 * LANGUAGE_LABELS, then open a PR. Nothing else needs to change.
 *
 * The three phrases map to the morning / afternoon / evening buckets chosen in
 * getTimeOfDayGreeting (evening: 18:00–04:59, afternoon: 12:00–17:59, morning:
 * 05:00–11:59). Some languages don't split the day the same way — pick the
 * closest everyday greeting for each bucket.
 */
import { getLanguage } from "obsidian";

export type Greeting = {
	morning: string;
	afternoon: string;
	evening: string;
};

export const GREETINGS: Record<string, Greeting> = {
	en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
	de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend" },
	es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
	fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
	pt: { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" },
	it: { morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera" },
	nl: { morning: "Goedemorgen", afternoon: "Goedemiddag", evening: "Goedenavond" },
	ru: { morning: "Доброе утро", afternoon: "Добрый день", evening: "Добрый вечер" },
	zh: { morning: "早上好", afternoon: "下午好", evening: "晚上好" },
	ja: { morning: "おはようございます", afternoon: "こんにちは", evening: "こんばんは" },
};

/** Human-readable names for the greeting-language dropdown. */
export const LANGUAGE_LABELS: Record<string, string> = {
	en: "English",
	de: "Deutsch",
	es: "Español",
	fr: "Français",
	pt: "Português",
	it: "Italiano",
	nl: "Nederlands",
	ru: "Русский",
	zh: "中文 (简体)",
	ja: "日本語",
};

/** Greeting-language setting value meaning "follow Obsidian's display language". */
export const GREETING_LANGUAGE_AUTO = "auto";

/**
 * Resolve the locale to greet in from the setting value. "auto" follows
 * Obsidian's display language via getLanguage(). A region variant falls back
 * to its base code (e.g. "pt-BR" -> "pt"), and any unsupported locale falls
 * back to English.
 */
export const resolveGreetingLocale = (setting: string): string => {
	const raw =
		setting && setting !== GREETING_LANGUAGE_AUTO
			? setting
			: getLanguage() || "en";
	if (GREETINGS[raw]) {
		return raw;
	}
	const base = raw.split("-")[0];
	return GREETINGS[base] ? base : "en";
};
