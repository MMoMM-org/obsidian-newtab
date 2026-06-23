import { FONT_WEIGHT } from "src/Types/Enums";

export interface SearchProvider {
	command: string;
	display: string;
}

export interface CustomQuote {
	text: string;
	author: string;
}

/**
 * A reusable, named text style. Assigned to one or more text elements (see
 * STYLE_TARGET) and resolved to CSS custom properties at render time. Every
 * field has a "neutral" value that means "don't change the current look":
 * empty `fontFamily`/`color` inherit, `sizePercent` 100 leaves the element's
 * base size untouched, `weight` INHERIT keeps the stylesheet's weight, and
 * `italic` false leaves it upright. The built-in Default style uses all
 * neutral values so it reproduces the plugin's original appearance exactly.
 */
export interface TextStyle {
	/** Stable identifier referenced by styleAssignments. */
	id: string;
	/** User-facing label shown in the editor and assignment dropdowns. */
	name: string;
	/** CSS font family, or "" to inherit the theme/interface font. */
	fontFamily: string;
	/** Size as a percentage of the element's base size (100 = unchanged). */
	sizePercent: number;
	/** Font weight, or INHERIT to keep the stylesheet's own weight. */
	weight: FONT_WEIGHT;
	/** Render the text in italics. */
	italic: boolean;
	/** Text color (hex), or "" to inherit. */
	color: string;
}
