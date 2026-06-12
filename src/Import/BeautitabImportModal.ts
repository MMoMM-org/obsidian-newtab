import { Modal, Notice, Setting } from "obsidian";
import type NewTabPlugin from "main";
import { FolderSuggest } from "src/Settings/FolderSuggest";
import {
	DEFAULT_IMPORT_IMAGE_FOLDER,
	importFromBeautitab,
} from "src/Import/Beautitab";

/**
 * One-time, opt-in BeautiTab → New Tab import. Summarises what carries over,
 * lets the user choose the vault folder for BeautiTab's local background images,
 * then runs the non-destructive import on confirm. Reached from the first-run
 * auto-popup and from the settings-tab fallback button.
 */
export class BeautitabImportModal extends Modal {
	private readonly plugin: NewTabPlugin;
	private readonly onComplete?: () => void;
	private folder: string;

	constructor(plugin: NewTabPlugin, onComplete?: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onComplete = onComplete;
		this.folder =
			plugin.settings.localBackgroundFolder ||
			DEFAULT_IMPORT_IMAGE_FOLDER;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Import from BeautiTab" });
		contentEl.createEl("p", {
			text: "Copy your BeautiTab configuration into NewTab. This is non-destructive — it merges BeautiTab's settings over your current NewTab settings. If your BeautiTab build stores an Unsplash access key, it moves into Obsidian's secure secret store (never your settings file).",
		});

		new Setting(contentEl)
			.setName("Background image folder")
			.setDesc(
				"Vault folder where BeautiTab's local background images are saved. Created if it doesn't exist."
			)
			.addSearch((component) => {
				new FolderSuggest(this.app, component.inputEl, (path) => {
					this.folder = path;
				});
				component.setPlaceholder(DEFAULT_IMPORT_IMAGE_FOLDER);
				component.setValue(this.folder);
				component.onChange((value) => {
					this.folder = value;
				});
			});

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText("Import").setCta();
				button.onClick(() => void this.runImport());
			})
			.addButton((button) => {
				button.setButtonText("Cancel");
				button.onClick(() => this.close());
			});
	}

	private async runImport(): Promise<void> {
		try {
			const result = await importFromBeautitab(
				this.plugin,
				this.folder.trim() || DEFAULT_IMPORT_IMAGE_FOLDER
			);

			if (!result.imported) {
				new Notice("No BeautiTab data found to import.");
				return;
			}

			const parts = ["Imported BeautiTab settings."];
			if (result.imageCount > 0) {
				parts.push(
					`${result.imageCount} background image${
						result.imageCount === 1 ? "" : "s"
					} copied.`
				);
			}
			if (result.keyImported) {
				parts.push("Unsplash key stored securely.");
			}
			new Notice(parts.join(" "));

			if (result.needsUnsplashKey) {
				new Notice(
					"Your background theme needs an Unsplash access key. Add one under NewTab settings → background settings.",
					10000
				);
			}
		} catch (error) {
			new Notice("BeautiTab import failed. See the console for details.");
			console.error("BeautiTab import failed", error);
		} finally {
			this.close();
			this.onComplete?.();
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
