import type { CSSProperties } from "react";
import { STYLE_TARGET } from "src/Types/Enums";
import type { TextStyle } from "src/Types/Interfaces";
import {
	DEFAULT_TEXT_STYLE,
	DEFAULT_TEXT_STYLE_ID,
} from "src/Settings/textStyles";
import { cssFontFamily } from "src/Utils/cssFontFamily";

/**
 * The CSS custom properties a resolved style sets on a text element's
 * container. App.scss reads these via `var(--nt-…, <base>)`, so an omitted
 * property falls back to the element's original value — which is how the
 * Default style leaves everything untouched. `--nt-size-scale` is always
 * present (1 = no change) because every element multiplies its base size by it.
 */
export type StyleVars = CSSProperties;

/** Convert one style into the CSS variables that express it. */
export function textStyleToVars(style: TextStyle): StyleVars {
	const vars: Record<string, string> = {};

	const family = cssFontFamily(style.fontFamily);
	if (family) {
		vars["--nt-font-family"] = family;
	}

	// Always emit the scale so elements can `calc(base * var(--nt-size-scale))`
	// unconditionally; a non-positive or missing percent means "no change".
	const percent = Number.isFinite(style.sizePercent) ? style.sizePercent : 100;
	vars["--nt-size-scale"] = String(percent > 0 ? percent / 100 : 1);

	if (style.weight) {
		vars["--nt-font-weight"] = style.weight;
	}
	if (style.italic) {
		vars["--nt-font-style"] = "italic";
	}
	if (style.color.trim()) {
		vars["--nt-color"] = style.color.trim();
	}

	return vars;
}

/**
 * Resolve the style assigned to `target` into CSS variables. A missing or
 * dangling assignment falls back to the Default style, so a target can never
 * be left unstyled even if its assigned style was deleted.
 */
export function resolveStyleVars(
	styles: TextStyle[],
	assignments: Record<STYLE_TARGET, string>,
	target: STYLE_TARGET
): StyleVars {
	const id = assignments[target] ?? DEFAULT_TEXT_STYLE_ID;
	const style =
		styles.find((candidate) => candidate.id === id) ??
		styles.find((candidate) => candidate.id === DEFAULT_TEXT_STYLE_ID) ??
		DEFAULT_TEXT_STYLE;
	return textStyleToVars(style);
}

/** Resolve CSS variables for every text element in one pass. */
export function resolveAllStyleVars(
	styles: TextStyle[],
	assignments: Record<STYLE_TARGET, string>
): Record<STYLE_TARGET, StyleVars> {
	return {
		[STYLE_TARGET.TIME]: resolveStyleVars(styles, assignments, STYLE_TARGET.TIME),
		[STYLE_TARGET.GREETING]: resolveStyleVars(
			styles,
			assignments,
			STYLE_TARGET.GREETING
		),
		[STYLE_TARGET.RECENT_FILES]: resolveStyleVars(
			styles,
			assignments,
			STYLE_TARGET.RECENT_FILES
		),
		[STYLE_TARGET.BOOKMARKS]: resolveStyleVars(
			styles,
			assignments,
			STYLE_TARGET.BOOKMARKS
		),
		[STYLE_TARGET.SEARCH]: resolveStyleVars(
			styles,
			assignments,
			STYLE_TARGET.SEARCH
		),
		[STYLE_TARGET.QUOTE]: resolveStyleVars(
			styles,
			assignments,
			STYLE_TARGET.QUOTE
		),
	};
}
