import { Modal, Notice, Setting } from "obsidian";
import type NewTabPlugin from "main";
import { FolderSuggest } from "src/Settings/FolderSuggest";
import {
	DEFAULT_IMPORT_IMAGE_FOLDER,
	ImportResult,
	importFromBeautitab,
} from "src/Import/Beautitab";
import { BackgroundTheme } from "src/Types/Enums";

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
		let result: ImportResult;
		try {
			result = await importFromBeautitab(
				this.plugin,
				this.folder.trim() || DEFAULT_IMPORT_IMAGE_FOLDER
			);
		} catch (error) {
			new Notice("BeautiTab import failed. See the console for details.");
			console.error("BeautiTab import failed", error);
			this.close();
			return;
		}

		if (!result.imported) {
			new Notice("No BeautiTab data found to import.");
			this.close();
			return;
		}

		this.renderComplete(result);
	}

	/**
	 * Replace the modal with a persistent summary and a short "what to do next"
	 * checklist, so the post-migration steps don't vanish like a transient notice.
	 */
	private renderComplete(result: ImportResult): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "BeautiTab import complete" });

		const summary = ["Your BeautiTab settings were merged into NewTab."];
		if (result.imageCount > 0) {
			const folder = this.folder.trim() || DEFAULT_IMPORT_IMAGE_FOLDER;
			summary.push(
				`${result.imageCount} background image${
					result.imageCount === 1 ? "" : "s"
				} copied to “${folder}”.`
			);
		}
		if (result.keyImported) {
			summary.push(
				"Your Unsplash access key was moved into Obsidian's secure secret store."
			);
		}
		contentEl.createEl("p", { text: summary.join(" ") });

		contentEl.createEl("p", { text: "A few things to finish up:" });
		const steps = contentEl.createEl("ol");
		const addStep = (text: string): void => {
			steps.createEl("li", { text });
		};

		if (result.needsUnsplashKey) {
			addStep(
				"Your background theme uses Unsplash but no key came across — add your own access key under background settings (the link is right there)."
			);
		}
		if (
			result.imageCount > 0 &&
			this.plugin.settings.backgroundTheme !== BackgroundTheme.LOCAL
		) {
			addStep(
				"To actually show the imported background images, set the background theme to “local”."
			);
		}
		addStep("Review your NewTab settings and adjust anything you like.");
		addStep(
			"Once you're happy, disable BeautiTab — and uninstall it whenever you're ready. NewTab has your settings now."
		);

		new Setting(contentEl).addButton((button) => {
			button.setButtonText("Done").setCta();
			button.onClick(() => this.close());
		});
	}

	onClose(): void {
		this.contentEl.empty();
		// Refresh the settings tab (if that's where we came from) so the fallback
		// import button reflects the now-completed state.
		this.onComplete?.();
	}
}
