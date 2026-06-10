/**
 * Lightweight debug logging for the external providers (Unsplash backgrounds,
 * ZenQuotes). Every provider routes its diagnostics through this single switch
 * so it can later be toggled from a settings GUI control with one wiring point.
 *
 * Uses `console.debug` (not `console.log`) per the Obsidian plugin guidelines —
 * it stays out of the default console view but is visible with verbose logging.
 *
 * Never pass secrets (e.g. the Unsplash access key) as arguments; log only
 * whether a key is present.
 */

let debugEnabled = false;

/**
 * Enable or disable provider debug logging. Wired to the "Debug logging"
 * settings toggle; off by default so a released plugin stays quiet.
 */
export const setDebugLogging = (enabled: boolean): void => {
	debugEnabled = enabled;
};

/** Whether provider debug logging is currently enabled. */
export const isDebugLogging = (): boolean => debugEnabled;

/**
 * Log a namespaced debug message, e.g. `debugLog("background", 'no key set')`.
 * No-op while logging is disabled.
 */
export const debugLog = (scope: string, ...args: unknown[]): void => {
	if (!debugEnabled) {
		return;
	}
	console.debug(`[NewTab:${scope}]`, ...args);
};
