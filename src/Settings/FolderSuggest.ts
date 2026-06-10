import { AbstractInputSuggest, App, TFolder } from "obsidian";

/**
 * Folder autocomplete for a text/search input. Suggests vault folders whose
 * path contains the typed query; selecting one writes its path back via the
 * callback. Used for the vault-notes quote folder picker.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private onSelectFolder: (path: string) => void
	) {
		super(app, inputEl);
	}

	getSuggestions(query: string): TFolder[] {
		const lower = query.toLowerCase();
		return this.app.vault
			.getAllLoadedFiles()
			.filter(
				(file): file is TFolder =>
					file instanceof TFolder &&
					file.path.toLowerCase().includes(lower)
			);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path || "/");
	}

	selectSuggestion(folder: TFolder): void {
		this.setValue(folder.path);
		this.onSelectFolder(folder.path);
		this.close();
	}
}
