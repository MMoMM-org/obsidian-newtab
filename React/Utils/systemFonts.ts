/**
 * Installed-font enumeration via the Local Font Access API
 * (`window.queryLocalFonts`). It's desktop-Chromium only and requires a user
 * gesture / permission grant, so every caller must tolerate an empty result:
 * on mobile (and when permission is denied) we simply fall back to free-text
 * font entry. The resolved family list is cached for the session.
 */

interface FontData {
	family: string;
}

interface QueryLocalFontsWindow {
	queryLocalFonts?: () => Promise<FontData[]>;
}

let cache: string[] | null = null;

/**
 * The window that owns the API. Prefer Obsidian's `activeWindow` (popout-safe)
 * but fall back to the bare global so this stays usable in plain DOM/test
 * environments where `activeWindow` isn't defined.
 */
function hostWindow(): QueryLocalFontsWindow {
	const w =
		typeof activeWindow !== "undefined"
			? (activeWindow as unknown)
			: (window as unknown);
	return w as QueryLocalFontsWindow;
}

/** Whether installed-font enumeration is available on this platform. */
export function systemFontsAvailable(): boolean {
	return typeof hostWindow().queryLocalFonts === "function";
}

/** Families resolved so far this session (empty until {@link loadSystemFonts}). */
export function getCachedSystemFonts(): string[] {
	return cache ?? [];
}

/**
 * Resolve the installed font families, de-duplicated and sorted. Caches the
 * result; subsequent calls return it without re-querying. Returns an empty
 * array (never throws) when the API is unavailable or permission is denied.
 */
export async function loadSystemFonts(): Promise<string[]> {
	if (cache) {
		return cache;
	}
	const query = hostWindow().queryLocalFonts;
	if (typeof query !== "function") {
		cache = [];
		return cache;
	}
	try {
		const fonts = await query();
		const families = Array.from(
			new Set(fonts.map((font) => font.family))
		).sort((a, b) => a.localeCompare(b));
		cache = families;
		return families;
	} catch {
		// Permission denied or otherwise unavailable — leave the cache unset so a
		// later gesture can retry, and report nothing for now.
		return [];
	}
}

/** Test seam: reset the session cache. */
export function resetSystemFontsCache(): void {
	cache = null;
}
