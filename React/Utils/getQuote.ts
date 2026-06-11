import { requestUrl } from "obsidian";
import { CustomQuote } from "src/Types/Interfaces";
import { debugLog } from "./debug";

export interface Quote {
	content: string;
	author: string;
	/**
	 * True when the quote was fetched from ZenQuotes. Their key-free tier
	 * requires visible attribution, so the UI shows a link only in this case.
	 */
	fromZenQuotes?: boolean;
	/**
	 * Vault path of the note this quote came from, when sourced from vault
	 * notes. The UI links the quote to the note so it can be opened.
	 */
	sourcePath?: string;
}

const EMPTY_QUOTE: Quote = { content: "", author: "" };

/**
 * Fetch a random quote from ZenQuotes (https://zenquotes.io/api/random).
 * Key-free tier; attribution to zenquotes.io is required by their terms.
 *
 * Returns null on any failure (network error, non-200, rate-limit sentinel, or
 * malformed body) so callers can fall back gracefully instead of surfacing a
 * console error on launch (replaces the dead api.quotable.io endpoint).
 */
const fetchOnlineQuote = async (): Promise<Quote | null> => {
	try {
		debugLog("quote", "requesting ZenQuotes", "https://zenquotes.io/api/random");
		const res = await requestUrl({
			url: "https://zenquotes.io/api/random",
			throw: false,
		});

		debugLog("quote", `ZenQuotes responded status ${res.status}`);

		if (res.status !== 200) {
			debugLog("quote", `non-200 (${res.status}) — falling back. Body:`, res.text);
			return null;
		}

		// ZenQuotes returns an array with a single { q, a, h } object.
		const body = res.json as Array<{ q?: string; a?: string }>;
		const first = Array.isArray(body) ? body[0] : undefined;

		if (!first?.q || !first?.a) {
			debugLog("quote", "malformed body (no q/a) — falling back. Body:", res.json);
			return null;
		}

		// When rate-limited, ZenQuotes returns a sentinel "quote" attributed
		// to zenquotes.io — treat that as a failure rather than showing it.
		if (first.a === "zenquotes.io") {
			debugLog("quote", "rate-limit sentinel from ZenQuotes — falling back");
			return null;
		}

		debugLog("quote", `resolved quote by ${first.a}`);
		return { content: first.q, author: first.a, fromZenQuotes: true };
	} catch (error) {
		debugLog("quote", "request threw (network/offline?) — falling back", error);
		return null;
	}
};

/** Pick a random quote from a pre-resolved list, or null when empty. */
const pickRandom = (quotes: Quote[]): Quote | null =>
	quotes.length
		? quotes[Math.floor(Math.random() * quotes.length)]
		: null;

/** Pick a random custom quote, or null when the user has none configured. */
const pickCustomQuote = (customQuotes: CustomQuote[]): Quote | null => {
	if (!customQuotes.length) {
		return null;
	}

	const picked =
		customQuotes[Math.floor(Math.random() * customQuotes.length)];

	return { content: picked.text, author: picked.author };
};

/** Return a copy of the array in a random order (Fisher–Yates). */
const shuffle = <T>(items: T[]): T[] => {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

/** Enabled quote sources and their already-resolved content. */
export interface QuoteSources {
	useOnline: boolean;
	useMyQuotes: boolean;
	useVaultNotes: boolean;
	customQuotes: CustomQuote[];
	/** Quotes resolved from vault notes (see getVaultQuotes). */
	vaultQuotes: Quote[];
}

/**
 * Returns a random quote from the union of the enabled sources (online
 * ZenQuotes, the user's custom quotes, and/or vault notes). Sources are tried
 * in a random order so the result is evenly mixed; the first that yields a
 * quote wins. Never throws — falls back through the remaining sources and
 * finally to an empty quote.
 */
const getQuote = async (sources: QuoteSources): Promise<Quote> => {
	debugLog(
		"quote",
		`sources — online=${sources.useOnline ? "on" : "off"}, myQuotes=${
			sources.useMyQuotes ? "on" : "off"
		}(${sources.customQuotes.length}), vaultNotes=${
			sources.useVaultNotes ? "on" : "off"
		}(${sources.vaultQuotes.length})`
	);

	const pickers: Array<() => Promise<Quote | null>> = [];

	if (sources.useOnline) {
		pickers.push(fetchOnlineQuote);
	}
	if (sources.useMyQuotes && sources.customQuotes.length) {
		pickers.push(() =>
			Promise.resolve(pickCustomQuote(sources.customQuotes))
		);
	}
	if (sources.useVaultNotes && sources.vaultQuotes.length) {
		pickers.push(() => Promise.resolve(pickRandom(sources.vaultQuotes)));
	}

	for (const pick of shuffle(pickers)) {
		const quote = await pick();
		if (quote) {
			return quote;
		}
	}

	return EMPTY_QUOTE;
};

export default getQuote;
