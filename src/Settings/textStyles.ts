import { FONT_WEIGHT, STYLE_TARGET } from "src/Types/Enums";
import type { TextStyle } from "src/Types/Interfaces";
import type { NewTabPluginSettings } from "src/Settings/Settings";

/**
 * Pure text-style data and normalisation, kept free of any Obsidian imports so
 * it can be reused by the React view and unit-tested without the Obsidian
 * runtime. The settings-tab UI lives in Settings.ts.
 */

/** Id of the built-in, non-deletable Default style. */
export const DEFAULT_TEXT_STYLE_ID = "default";

/**
 * The built-in Default style. Every field is neutral, so applying it changes
 * nothing about the current look — the baseline every fresh target points at.
 */
export const DEFAULT_TEXT_STYLE: TextStyle = {
	id: DEFAULT_TEXT_STYLE_ID,
	name: "Default",
	fontFamily: "",
	sizePercent: 100,
	weight: FONT_WEIGHT.INHERIT,
	italic: false,
	color: "",
};

/** Sentence-case labels for each assignable text element. */
export const STYLE_TARGET_LABELS: Record<STYLE_TARGET, string> = {
	[STYLE_TARGET.TIME]: "Time",
	[STYLE_TARGET.GREETING]: "Greeting",
	[STYLE_TARGET.RECENT_FILES]: "Recent files",
	[STYLE_TARGET.BOOKMARKS]: "Bookmarks",
	[STYLE_TARGET.SEARCH]: "Inline search",
	[STYLE_TARGET.QUOTE]: "Quote",
};

/** Every target assigned to the Default style — the out-of-the-box mapping. */
export const defaultStyleAssignments = (): Record<STYLE_TARGET, string> => ({
	[STYLE_TARGET.TIME]: DEFAULT_TEXT_STYLE_ID,
	[STYLE_TARGET.GREETING]: DEFAULT_TEXT_STYLE_ID,
	[STYLE_TARGET.RECENT_FILES]: DEFAULT_TEXT_STYLE_ID,
	[STYLE_TARGET.BOOKMARKS]: DEFAULT_TEXT_STYLE_ID,
	[STYLE_TARGET.SEARCH]: DEFAULT_TEXT_STYLE_ID,
	[STYLE_TARGET.QUOTE]: DEFAULT_TEXT_STYLE_ID,
});

/**
 * Ensure the style settings are well-formed after a load/merge:
 * - `textStyles` is a fresh array that always starts with a Default style
 *   (so the editor and every assignment fallback have something to resolve to).
 * - `styleAssignments` has an entry for every target, defaulting to Default,
 *   and any id pointing at a now-missing style is reset to Default.
 *
 * Cloning here also stops the settings UI from mutating the shared
 * DEFAULT_SETTINGS arrays in place. Runs for every load (new and existing
 * installs); old data.json simply gets the defaults filled in.
 */
export const normalizeStyleSettings = (
	settings: NewTabPluginSettings
): void => {
	const styles = Array.isArray(settings.textStyles)
		? settings.textStyles.map((style) => ({ ...style }))
		: [];
	if (!styles.some((style) => style.id === DEFAULT_TEXT_STYLE_ID)) {
		styles.unshift({ ...DEFAULT_TEXT_STYLE });
	}
	settings.textStyles = styles;

	const known = new Set(styles.map((style) => style.id));
	const assignments = defaultStyleAssignments();
	const saved = (settings.styleAssignments ?? {}) as Partial<
		Record<STYLE_TARGET, string>
	>;
	for (const target of Object.values(STYLE_TARGET)) {
		const id = saved[target];
		if (id && known.has(id)) {
			assignments[target] = id;
		}
	}
	settings.styleAssignments = assignments;
};
