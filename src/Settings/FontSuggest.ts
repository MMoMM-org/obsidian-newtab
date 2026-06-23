import { AbstractInputSuggest, App } from "obsidian";
import {
	getCachedSystemFonts,
	loadSystemFonts,
} from "React/Utils/systemFonts";
import { cssFontFamily } from "src/Utils/cssFontFamily";

/**
 * Installed-font autocomplete for the font-family text input. Suggests system
 * fonts whose name contains the typed query, previewing each option in its own
 * typeface; selecting one writes the family back via the callback.
 *
 * Enumeration (Local Font Access API) needs a user gesture, so the list is
 * loaded lazily from inside getSuggestions — typing is itself a gesture, and
 * each keystroke re-queries, so the list fills in as the user types. On
 * platforms without the API (mobile) there are simply no suggestions and the
 * field behaves as plain free text.
 */
export class FontSuggest extends AbstractInputSuggest<string> {
	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private onSelectFont: (font: string) => void
	) {
		super(app, inputEl);
	}

	getSuggestions(query: string): string[] {
		const fonts = getCachedSystemFonts();
		if (fonts.length === 0) {
			// Not loaded yet; this keystroke is the gesture that triggers it.
			void loadSystemFonts();
		}
		const lower = query.toLowerCase();
		return fonts
			.filter((font) => font.toLowerCase().includes(lower))
			.slice(0, 50);
	}

	renderSuggestion(font: string, el: HTMLElement): void {
		el.setText(font);
		// Preview each option in its own face. setProperty (not `.style.x = …`)
		// keeps this a dynamic, per-suggestion value rather than a hardcoded
		// theme style.
		el.style.setProperty("font-family", cssFontFamily(font));
	}

	selectSuggestion(font: string): void {
		this.setValue(font);
		this.onSelectFont(font);
		this.close();
	}
}
