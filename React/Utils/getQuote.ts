import { requestUrl } from "obsidian";
import { QUOTE_SOURCE } from "src/Types/Enums";
import { CustomQuote } from "src/Types/Interfaces";

export interface Quote {
	content: string;
	author: string;
	/**
	 * True when the quote was fetched from ZenQuotes. Their key-free tier
	 * requires visible attribution, so the UI shows a link only in this case.
	 */
	fromZenQuotes?: boolean;
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
		const res = await requestUrl({
			url: "https://zenquotes.io/api/random",
			throw: false,
		});

		if (res.status !== 200) {
			return null;
		}

		// ZenQuotes returns an array with a single { q, a, h } object.
		const body = res.json as Array<{ q?: string; a?: string }>;
		const first = Array.isArray(body) ? body[0] : undefined;

		if (!first?.q || !first?.a) {
			return null;
		}

		// When rate-limited, ZenQuotes returns a sentinel "quote" attributed
		// to zenquotes.io — treat that as a failure rather than showing it.
		if (first.a === "zenquotes.io") {
			return null;
		}

		return { content: first.q, author: first.a, fromZenQuotes: true };
	} catch {
		return null;
	}
};

/**
 * Pick a random custom quote, or null when the user has none configured.
 */
const pickCustomQuote = (customQuotes: CustomQuote[]): Quote | null => {
	if (!customQuotes.length) {
		return null;
	}

	const picked =
		customQuotes[Math.floor(Math.random() * customQuotes.length)];

	return { content: picked.text, author: picked.author };
};

/**
 * Based on the configured quoteSource, returns a random quote from the online
 * source (ZenQuotes), the user's custom quotes, or both. Never throws: on
 * failure it falls back to the other source and finally to an empty quote.
 * @param quoteSource
 * @param customQuotes
 */
const getQuote = async (
	quoteSource: QUOTE_SOURCE,
	customQuotes: CustomQuote[]
): Promise<Quote> => {
	if (quoteSource === QUOTE_SOURCE.MY_QUOTES) {
		return pickCustomQuote(customQuotes) ?? EMPTY_QUOTE;
	}

	if (quoteSource === QUOTE_SOURCE.ONLINE) {
		return (
			(await fetchOnlineQuote()) ??
			pickCustomQuote(customQuotes) ??
			EMPTY_QUOTE
		);
	}

	// BOTH: pick one source at random, fall back to the other, then empty.
	if (Math.floor(Math.random() * 2) === 0) {
		return (
			(await fetchOnlineQuote()) ??
			pickCustomQuote(customQuotes) ??
			EMPTY_QUOTE
		);
	}

	return (
		pickCustomQuote(customQuotes) ??
		(await fetchOnlineQuote()) ??
		EMPTY_QUOTE
	);
};

export default getQuote;
