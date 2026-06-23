import { AbstractInputSuggest, App } from "obsidian";
import { loadSystemFonts } from "React/Utils/systemFonts";
import { cssFontFamily } from "src/Utils/cssFontFamily";

/**
 * Installed-font autocomplete for the font-family text input. Suggests system
 * fonts whose name contains the typed query, previewing each option in its own
 * typeface; selecting one writes the family back via the callback.
 *
 * Enumeration (Local Font Access API) needs a user gesture, which focusing or
 * typing in the field provides. getSuggestions awaits the (cached-after-first)
 * load, so the full list appears the moment the field is focused — no throwaway
 * keystroke needed to kick it off — and an empty query lists every font. On
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
		// Render the whole list when browsing unfiltered; the popover scrolls
		// and typing narrows it further. (Base class default is only 100.)
		this.limit = 2000;
	}

	async getSuggestions(query: string): Promise<string[]> {
		const fonts = await loadSystemFonts();
		const lower = query.toLowerCase();
		return fonts.filter((font) => font.toLowerCase().includes(lower));
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
