import { getBookmarkGroups } from "React/Utils/getBookmarks";
import { debugLog, setDebugLogging } from "React/Utils/debug";
import {
	GREETINGS,
	LANGUAGE_LABELS,
	GREETING_LANGUAGE_AUTO,
} from "React/Utils/greetings";
import NewTabPlugin from "main";
import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	SecretComponent,
	setIcon,
	normalizePath,
} from "obsidian";
import ChooseSearchProvider from "src/ChooseSearchProvider/ChooseSearchProvider";
import CustomQuotesModel from "src/CustomQuotesModel/CustomQuotesModel";
import {
	BOOKMARK_SOURCE,
	BackgroundTheme,
	QUOTE_SOURCE,
	VAULT_QUOTE_SELECTION,
	TIME_FORMAT,
	FONT_WEIGHT,
	STYLE_TARGET,
} from "src/Types/Enums";
import { FolderSuggest } from "src/Settings/FolderSuggest";
import { BeautitabImportModal } from "src/Import/BeautitabImportModal";
import {
	isBeautitabEnabled,
	BEAUTITAB_CONFLICT_MESSAGE,
} from "src/Import/Beautitab";
import { CustomQuote, SearchProvider, TextStyle } from "src/Types/Interfaces";
import { FontSuggest } from "src/Settings/FontSuggest";
import {
	DEFAULT_TEXT_STYLE,
	DEFAULT_TEXT_STYLE_ID,
	STYLE_TARGET_LABELS,
	defaultStyleAssignments,
} from "src/Settings/textStyles";
import capitalizeFirstLetter from "src/Utils/capitalizeFirstLetter";
import { themeUsesUnsplash } from "src/Utils/themeUsesUnsplash";
import { uniqueVaultPath } from "src/Utils/uniqueVaultPath";
import { createElement } from "react";
import { Root, createRoot } from "react-dom/client";
import SettingsHeader from "React/Components/SettingsHeader/SettingsHeader";

const NEWTAB_DOCS_URL = "https://github.com/MMoMM-org/obsidian-newtab#readme";

const DEFAULT_SEARCH_PROVIDER: SearchProvider = {
	command: "switcher:open",
	display: "Obsidian Core Quick Switcher",
};

export const SEARCH_PROVIDER = [
	"switcher",
	"omnisearch",
	"darlal-switcher-plus",
	"obsidian-another-quick-switcher",
];

export interface NewTabPluginSettings {
	backgroundTheme: BackgroundTheme;
	customBackground: string;
	customTopic: string;
	/**
	 * SecretStorage ID (the name the user gives the secret) under which the
	 * Unsplash access key is stored. Only this ID lives in data.json; the key
	 * value itself stays in Obsidian's secret store. Empty when unset.
	 */
	unsplashKeySecretId: string;
	/**
	 * Vault folder holding the "Local" background images; every image inside it
	 * (and its subfolders) is resolved to an app:// resource URL at render time
	 * and shown at random. Stored as a path (not base64) to keep data.json small.
	 * Empty means no local backgrounds are configured.
	 */
	localBackgroundFolder: string;
	showTopLeftSearchButton: boolean;
	topLeftSearchProvider: SearchProvider;
	/**
	 * Show back/forward navigation buttons on the new tab. Useful because landing
	 * on the new tab via "go back" otherwise leaves no visible way to navigate
	 * forward again (#78).
	 */
	showNavButtons: boolean;
	showTime: boolean;
	timeFormat: TIME_FORMAT;
	showGreeting: boolean;
	greetingText: string;
	greetingLanguage: string;
	showInlineSearch: boolean;
	inlineSearchProvider: SearchProvider;
	showRecentFiles: boolean;
	showBookmarks: boolean;
	bookmarkSource: BOOKMARK_SOURCE;
	bookmarkGroup: string;
	showQuote: boolean;
	quoteUseOnline: boolean;
	quoteUseMyQuotes: boolean;
	quoteUseVaultNotes: boolean;
	quoteVaultSelectionMode: VAULT_QUOTE_SELECTION;
	quoteVaultTag: string;
	quoteVaultFolder: string;
	quoteVaultContentProperty: string;
	quoteVaultAuthorProperty: string;
	customQuotes: CustomQuote[];
	debugLogging: boolean;
	/**
	 * Whether the one-time BeautiTab import has been *offered* (the auto-popup
	 * shown). Set once, regardless of whether the user accepted or dismissed, so
	 * the popup never auto-fires twice. The settings-tab fallback button stays
	 * available until the import actually runs (see beautitabImportCompleted).
	 */
	beautitabImportOffered: boolean;
	/**
	 * Whether a BeautiTab import has actually run. Drives the settings-tab
	 * fallback button's visibility and permanently retires the prompt.
	 */
	beautitabImportCompleted: boolean;
	/**
	 * Reusable, named text styles. Always contains the built-in Default style
	 * (id DEFAULT_TEXT_STYLE_ID) as its first entry; users add/remove their own.
	 */
	textStyles: TextStyle[];
	/**
	 * Which style (by id) each text element uses. A target pointing at a missing
	 * id falls back to the Default style at resolve time, so deleting a style
	 * can never break a target.
	 */
	styleAssignments: Record<STYLE_TARGET, string>;
}

/** Sentence-case labels for the font-weight dropdown. */
const WEIGHT_LABELS: Record<FONT_WEIGHT, string> = {
	[FONT_WEIGHT.INHERIT]: "Default",
	[FONT_WEIGHT.NORMAL]: "Normal",
	[FONT_WEIGHT.MEDIUM]: "Medium",
	[FONT_WEIGHT.SEMIBOLD]: "Semibold",
	[FONT_WEIGHT.BOLD]: "Bold",
};

export const DEFAULT_SETTINGS: NewTabPluginSettings = {
	backgroundTheme: BackgroundTheme.SEASONS_AND_HOLIDAYS,
	customBackground: "",
	customTopic: "",
	unsplashKeySecretId: "",
	localBackgroundFolder: "",
	showTopLeftSearchButton: true,
	topLeftSearchProvider: DEFAULT_SEARCH_PROVIDER,
	showNavButtons: true,
	showTime: true,
	timeFormat: TIME_FORMAT.TWELVE_HOUR,
	showGreeting: true,
	greetingText: "Hello, Beautiful.",
	greetingLanguage: GREETING_LANGUAGE_AUTO,
	showInlineSearch: true,
	inlineSearchProvider: DEFAULT_SEARCH_PROVIDER,
	showRecentFiles: true,
	showBookmarks: false,
	bookmarkSource: BOOKMARK_SOURCE.ALL,
	bookmarkGroup: "",
	showQuote: true,
	quoteUseOnline: true,
	quoteUseMyQuotes: false,
	quoteUseVaultNotes: false,
	quoteVaultSelectionMode: VAULT_QUOTE_SELECTION.TAG,
	quoteVaultTag: "type/note/quote",
	quoteVaultFolder: "",
	quoteVaultContentProperty: "Quote",
	quoteVaultAuthorProperty: "Author",
	customQuotes: [],
	debugLogging: false,
	beautitabImportOffered: false,
	beautitabImportCompleted: false,
	textStyles: [{ ...DEFAULT_TEXT_STYLE }],
	styleAssignments: defaultStyleAssignments(),
};

/**
 * Migrate the legacy single-select `quoteSource` to the per-source toggles.
 * Runs only for data.json saved before the toggles existed (identified by the
 * toggle being absent while the old field is present); new installs are
 * untouched. `data` is the raw persisted object, `settings` the merged result.
 */
export const migrateQuoteSources = (
	settings: NewTabPluginSettings,
	data: Record<string, unknown>
): void => {
	if (data.quoteUseOnline !== undefined || data.quoteSource === undefined) {
		return;
	}
	const source = data.quoteSource;
	settings.quoteUseOnline =
		source === QUOTE_SOURCE.ONLINE || source === QUOTE_SOURCE.BOTH;
	settings.quoteUseMyQuotes =
		source === QUOTE_SOURCE.MY_QUOTES || source === QUOTE_SOURCE.BOTH;
};

export class NewTabPluginSettingTab extends PluginSettingTab {
	plugin: NewTabPlugin;
	/** React root for the branded header rendered at the top of the tab. */
	private headerRoot: Root | null = null;
	/** Id of the currently selected settings tab. */
	private activeTab = "background";
	/** Ids of style editors currently expanded (preserved across re-renders). */
	private readonly expandedStyles = new Set<string>();
	/** The settings tabs, in display order. */
	private readonly tabs: ReadonlyArray<{ id: string; label: string }> = [
		{ id: "background", label: "Background" },
		{ id: "search", label: "Search" },
		{ id: "time", label: "Time" },
		{ id: "greeting", label: "Greeting" },
		{ id: "recent", label: "Recent files" },
		{ id: "bookmarks", label: "Bookmarks" },
		{ id: "quote", label: "Quote" },
		{ id: "styles", label: "Styles" },
		{ id: "debug", label: "Debug" },
	];

	constructor(app: App, plugin: NewTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Mount the React settings header (name · version · author · docs) into a
	 * container at the top of the tab. Re-mounts on each render() since
	 * containerEl is emptied; unmounted on hide().
	 */
	private renderHeader(containerEl: HTMLElement): void {
		const headerEl = containerEl.createDiv();
		try {
			this.headerRoot?.unmount();
		} catch {
			// Already torn down / mid-render — safe to ignore.
		}
		const manifest = this.plugin.manifest;
		this.headerRoot = createRoot(headerEl);
		this.headerRoot.render(
			createElement(SettingsHeader, {
				name: manifest.name,
				version: manifest.version,
				author: manifest.author,
				authorUrl: manifest.authorUrl,
				documentationUrl: NEWTAB_DOCS_URL,
			})
		);
	}

	/**
	 * Persistent warning while BeautiTab is enabled — both plugins hijack new
	 * tabs and fight over each empty leaf. Re-evaluated on every render (settings
	 * open / in-tab re-render), so it disappears once BeautiTab is disabled.
	 */
	private renderConflictWarning(containerEl: HTMLElement): void {
		if (!isBeautitabEnabled(this.app)) {
			return;
		}
		const warning = containerEl.createDiv({ cls: "newtab-conflict-warning" });
		setIcon(
			warning.createSpan({ cls: "newtab-conflict-warning-icon" }),
			"alert-triangle"
		);
		warning.createSpan({ text: BEAUTITAB_CONFLICT_MESSAGE });
	}

	hide(): void {
		try {
			this.headerRoot?.unmount();
		} catch {
			// Already torn down — safe to ignore.
		}
		this.headerRoot = null;
		super.hide();
	}

	/**
	 * Render the currently selected search provider as a highlighted line
	 * beneath a setting's description. Keeping it in the info block (rather than
	 * a disabled text input in the control area) stops a long description from
	 * squeezing the value into a narrow, truncating column on the right.
	 */
	private renderSelectedProvider(setting: Setting, display: string): void {
		const current = setting.descEl.createDiv({
			cls: "newtab-search-provider-current",
		});
		current.createSpan({
			cls: "newtab-search-provider-current-label",
			text: "Selected: ",
		});
		current.createSpan({
			cls: "newtab-search-provider-current-value",
			text: display,
		});
	}

	/**
	 * Let the user pick image files from their device and copy them into the
	 * configured background image folder, so they join the local-background
	 * rotation. Uses a hidden file input (works on desktop and mobile, with no
	 * Node/Electron dependency). Requires a folder to be set; it is created if
	 * it doesn't exist yet.
	 */
	private transferLocalImagesToVault(): void {
		const folder = this.plugin.settings.localBackgroundFolder.trim();
		if (!folder) {
			new Notice("Set a background image folder first.");
			return;
		}

		const input = activeDocument.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.multiple = true;
		input.addEventListener("change", () => {
			void this.importPickedImages(Array.from(input.files ?? []), folder);
		});
		input.click();
	}

	/** Copy the picked browser File objects into `folder`, then refresh. */
	private async importPickedImages(
		files: File[],
		folder: string
	): Promise<void> {
		if (files.length === 0) {
			return;
		}

		const normalizedFolder = normalizePath(folder);
		if (!this.app.vault.getAbstractFileByPath(normalizedFolder)) {
			await this.app.vault.createFolder(normalizedFolder);
		}

		let copied = 0;
		for (const file of files) {
			const data = await file.arrayBuffer();
			const destPath = this.uniqueVaultPath(
				normalizedFolder,
				file.name || "background.png"
			);
			await this.app.vault.createBinary(destPath, data);
			copied++;
		}

		new Notice(
			`Copied ${copied} image${copied === 1 ? "" : "s"} into "${folder}".`
		);
		// Folder contents changed; nudge any open new-tab view to re-resolve.
		this.plugin.settingsObservable.setValue(this.plugin.settings);
	}

	/**
	 * A vault path inside `folder` for `filename` that doesn't collide with an
	 * existing file, appending " 1", " 2", … before the extension as needed.
	 */
	private uniqueVaultPath(folder: string, filename: string): string {
		return uniqueVaultPath(this.app, folder, filename);
	}

	/**
	 * When BeautiTab is present in this vault and its settings haven't been
	 * imported yet, offer a fallback "Import from BeautiTab" button. This covers
	 * the user who dismissed the one-time first-run popup. Presence is detected
	 * once at load and cached on `plugin.beautitabDetected`, so this stays a
	 * synchronous render with no async-append race.
	 */
	private renderBeautitabImport(containerEl: HTMLElement): void {
		if (
			!this.plugin.beautitabDetected ||
			this.plugin.settings.beautitabImportCompleted
		) {
			return;
		}

		new Setting(containerEl).setHeading().setName("Import from BeautiTab");
		new Setting(containerEl)
			.setName("Import BeautiTab settings")
			.setDesc(
				"BeautiTab is set up in this vault. Copy its configuration into NewTab — non-destructive, runs once."
			)
			.addButton((button) => {
				button.setButtonText("Import from BeautiTab").setCta();
				button.onClick(() => {
					new BeautitabImportModal(this.plugin, () =>
						this.render()
					).open();
				});
			});
	}

	/**
	 * Persist a change to the text styles and push it to the live view. The
	 * style arrays/objects are replaced with fresh references (not mutated in
	 * place) so the React view's memoised style resolution actually recomputes.
	 */
	private commitStyleChange(): void {
		// New array/object *references* so the React view's memoised style
		// resolution recomputes — but the style objects themselves keep their
		// identity. The editor closures hold references to those objects, so
		// cloning them here would orphan an in-progress edit (the symptom being
		// a name or font that appears not to save after the first change).
		this.plugin.settings.textStyles = [...this.plugin.settings.textStyles];
		this.plugin.settings.styleAssignments = {
			...this.plugin.settings.styleAssignments,
		};
		this.plugin.settingsObservable.setValue(this.plugin.settings);
		void this.plugin.saveSettings();
	}

	/** An id not already used by an existing style (e.g. "style-1", "style-2"). */
	private nextStyleId(): string {
		const used = new Set(
			this.plugin.settings.textStyles.map((style) => style.id)
		);
		let n = this.plugin.settings.textStyles.length;
		let id = `style-${n}`;
		while (used.has(id)) {
			n += 1;
			id = `style-${n}`;
		}
		return id;
	}

	/** Append a new style (a copy of Default) and re-render the tab. */
	private addStyle(): void {
		const count = this.plugin.settings.textStyles.length;
		const id = this.nextStyleId();
		this.plugin.settings.textStyles.push({
			...DEFAULT_TEXT_STYLE,
			id,
			name: `Style ${count}`,
		});
		// Open the new style straight away so it's ready to edit.
		this.expandedStyles.add(id);
		this.commitStyleChange();
		this.render();
	}

	/**
	 * Remove a style and point any element using it back at Default, so a
	 * deletion can never leave a target referencing a missing style.
	 */
	private deleteStyle(id: string): void {
		if (id === DEFAULT_TEXT_STYLE_ID) {
			return;
		}
		this.plugin.settings.textStyles =
			this.plugin.settings.textStyles.filter((style) => style.id !== id);
		const assignments = this.plugin.settings.styleAssignments;
		for (const target of Object.values(STYLE_TARGET)) {
			if (assignments[target] === id) {
				assignments[target] = DEFAULT_TEXT_STYLE_ID;
			}
		}
		this.commitStyleChange();
		this.render();
	}

	/** Reset the built-in Default style back to its neutral baseline. */
	private resetDefaultStyle(): void {
		const def = this.plugin.settings.textStyles.find(
			(style) => style.id === DEFAULT_TEXT_STYLE_ID
		);
		if (def) {
			Object.assign(def, DEFAULT_TEXT_STYLE);
		}
		this.commitStyleChange();
		this.render();
	}

	/** Render the editor controls for one style, inside a collapsible block. */
	private renderStyleEditor(containerEl: HTMLElement, style: TextStyle): void {
		const isDefault = style.id === DEFAULT_TEXT_STYLE_ID;

		// Each style is a collapsible <details> so the editors don't dominate the
		// tab; open/closed state is remembered across re-renders. To revert to
		// the always-open layout, render the rows straight into `containerEl`.
		const details = containerEl.createEl("details", { cls: "newtab-style" });
		details.open = this.expandedStyles.has(style.id);
		details.addEventListener("toggle", () => {
			if (details.open) {
				this.expandedStyles.add(style.id);
			} else {
				this.expandedStyles.delete(style.id);
			}
		});
		const summary = details.createEl("summary", {
			cls: "newtab-style-summary",
		});
		summary.createSpan({
			cls: "newtab-style-summary-name",
			text: style.name,
		});

		if (isDefault) {
			new Setting(details)
				.setName("Default style")
				.setDesc(
					"The baseline style — leave it unchanged to keep the original look, or edit it to restyle everything at once."
				)
				.addExtraButton((button) => {
					button
						.setIcon("rotate-ccw")
						.setTooltip("Reset the default style");
					button.onClick(() => this.resetDefaultStyle());
				});
		} else {
			new Setting(details)
				.setName("Name")
				.addText((text) => {
					text.setValue(style.name);
					// Track the name at focus so we only re-render (to refresh the
					// summary and assignment dropdowns) when it actually changed —
					// re-rendering on every blur would be disruptive.
					let nameAtFocus = style.name;
					text.onChange((value) => {
						style.name = value;
						this.commitStyleChange();
					});
					text.inputEl.addEventListener("focus", () => {
						nameAtFocus = style.name;
					});
					text.inputEl.addEventListener("blur", () => {
						if (style.name !== nameAtFocus) {
							this.render();
						}
					});
				})
				.addExtraButton((button) => {
					button.setIcon("trash").setTooltip("Delete style");
					button.onClick(() => this.deleteStyle(style.id));
				});
		}

		new Setting(details)
			.setName("Font")
			.setDesc(
				"Type a font family, or start typing to pick from your installed fonts (desktop). Leave empty for the theme font."
			)
			.addText((text) => {
				text.setPlaceholder("Theme default");
				text.setValue(style.fontFamily);
				new FontSuggest(this.app, text.inputEl, (font) => {
					style.fontFamily = font;
					this.commitStyleChange();
				});
				text.onChange((value) => {
					style.fontFamily = value;
					this.commitStyleChange();
				});
			});

		const sizeSetting = new Setting(details)
			.setName("Size")
			.setDesc("Percentage of the element's default size.");
		sizeSetting.addSlider((slider) => {
			slider.setLimits(50, 300, 5);
			slider.setValue(
				Math.min(300, Math.max(50, style.sizePercent || 100))
			);
			slider.onChange((value) => {
				style.sizePercent = value;
				sizeValue.setText(`${value}%`);
				this.commitStyleChange();
			});
		});
		// A live read-out of the current percentage, since the slider's own
		// (deprecated) dynamic tooltip only shows while dragging.
		const sizeValue = sizeSetting.controlEl.createSpan({
			cls: "newtab-style-size-value",
			text: `${Math.round(style.sizePercent) || 100}%`,
		});

		new Setting(details).setName("Weight").addDropdown((dropdown) => {
			for (const weight of Object.values(FONT_WEIGHT)) {
				dropdown.addOption(weight, WEIGHT_LABELS[weight]);
			}
			dropdown.setValue(style.weight);
			dropdown.onChange((value) => {
				style.weight = value as FONT_WEIGHT;
				this.commitStyleChange();
			});
		});

		new Setting(details).setName("Italic").addToggle((toggle) => {
			toggle.setValue(style.italic);
			toggle.onChange((value) => {
				style.italic = value;
				this.commitStyleChange();
			});
		});

		new Setting(details)
			.setName("Color")
			.setDesc("Reset to inherit the theme's text color.")
			.addColorPicker((picker) => {
				// "" means inherit; show the current default colour as a starting
				// point without persisting it until the user actually picks one.
				picker.setValue(style.color || "#dadada");
				picker.onChange((value) => {
					style.color = value;
					this.commitStyleChange();
				});
			})
			.addExtraButton((button) => {
				button
					.setIcon("rotate-ccw")
					.setTooltip("Reset to theme color");
				button.onClick(() => {
					style.color = "";
					this.commitStyleChange();
					this.render();
				});
			});
	}

	/**
	 * Render the "applied style" dropdown for a single element, shown at the
	 * bottom of that element's own tab. Styles themselves are created/edited on
	 * the Styles tab; here you just pick which one this element uses.
	 */
	private renderAppliedStyle(
		containerEl: HTMLElement,
		target: STYLE_TARGET
	): void {
		new Setting(containerEl).setHeading().setName("Text style");
		new Setting(containerEl)
			.setName(`${STYLE_TARGET_LABELS[target]} style`)
			.setDesc(
				"Which text style this element uses. Add or edit styles on the styles tab."
			)
			.addDropdown((dropdown) => {
				for (const style of this.plugin.settings.textStyles) {
					dropdown.addOption(style.id, style.name);
				}
				dropdown.setValue(this.plugin.settings.styleAssignments[target]);
				dropdown.onChange((value) => {
					this.plugin.settings.styleAssignments[target] = value;
					this.commitStyleChange();
				});
			});
	}

	/** The Styles tab: define/edit reusable text styles (no assignments here). */
	private renderStylesTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Styles")
			.setDesc(
				"Reusable text styles you can assign to each element from its own tab. Add as many as you like; the default style keeps the original look."
			)
			.addButton((button) => {
				button.setButtonText("Add style").setCta();
				button.onClick(() => this.addStyle());
			});
		for (const style of this.plugin.settings.textStyles) {
			this.renderStyleEditor(containerEl, style);
		}
	}

	display(): void {
		this.render();
	}

	/**
	 * Build the settings UI. Split out from the (deprecated) `display()` so our
	 * own in-tab re-renders call `render()` directly instead of the deprecated
	 * API; `display()` stays as the thin override Obsidian invokes.
	 */
	private render(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.renderHeader(containerEl);

		this.renderConflictWarning(containerEl);

		this.renderBeautitabImport(containerEl);

		const tabBar = containerEl.createDiv({ cls: "newtab-tab-bar" });
		tabBar.setAttribute("role", "tablist");
		for (const tab of this.tabs) {
			this.addTab(tabBar, tab.id, tab.label);
		}

		const content = containerEl.createDiv({ cls: "newtab-tab-content" });
		this.renderActiveTab(content);
	}

	/** Render one tab button into the tab bar. */
	private addTab(tabBar: HTMLElement, id: string, label: string): void {
		const isActive = id === this.activeTab;
		const button = tabBar.createEl("button", {
			cls: `newtab-tab${isActive ? " is-active" : ""}`,
			text: label,
		});
		button.setAttribute("role", "tab");
		button.setAttribute("aria-selected", String(isActive));
		button.addEventListener("click", () => {
			this.activeTab = id;
			this.render();
		});
	}

	/** Dispatch to the active tab's renderer. */
	private renderActiveTab(containerEl: HTMLElement): void {
		switch (this.activeTab) {
			case "search":
				this.renderSearchTab(containerEl);
				break;
			case "time":
				this.renderTimeTab(containerEl);
				break;
			case "greeting":
				this.renderGreetingTab(containerEl);
				break;
			case "recent":
				this.renderRecentFilesTab(containerEl);
				break;
			case "bookmarks":
				this.renderBookmarksTab(containerEl);
				break;
			case "quote":
				this.renderQuoteTab(containerEl);
				break;
			case "styles":
				this.renderStylesTab(containerEl);
				break;
			case "debug":
				this.renderDebugTab(containerEl);
				break;
			case "background":
			default:
				this.renderBackgroundTab(containerEl);
				break;
		}
	}

	/** Background tab: theme, Unsplash key, custom sources, local images. */
	private renderBackgroundTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Background theme")
			.setDesc(
				`What theme would you like to utilize for the random backgrounds? "seasons and holidays" will use a different tag depending on the time of the year. Custom will allow you to input your own URL. Local will use the local images imported below.`
			)
			.addDropdown((component) => {
				Object.values(BackgroundTheme).forEach((theme) => {
					component.addOption(theme, capitalizeFirstLetter(theme));
				});

				component.setValue(this.plugin.settings.backgroundTheme);

				component.onChange((value: BackgroundTheme) => {
					this.plugin.settings.backgroundTheme = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		if (themeUsesUnsplash(this.plugin.settings.backgroundTheme)) {
			const unsplashKeySetting = new Setting(containerEl)
				.setName("Unsplash access key")
				.setDesc(
					createFragment((frag) => {
						frag.appendText(
							"Required for themed backgrounds. Create a free app at "
						);
						frag.createEl("a", {
							text: "unsplash.com/oauth/applications",
							href: "https://unsplash.com/oauth/applications",
						});
						frag.appendText(
							", then paste its access key here. Stored securely outside your settings file."
						);
					})
				);
			// SecretComponent manages the secret in Obsidian's keystore itself:
			// setValue/onChange operate on the secret ID (the name the user gives
			// it), NOT the raw value. We persist only that ID and resolve the
			// live key at use-time via secretStorage.getSecret(id).
			const secret = new SecretComponent(
				this.app,
				unsplashKeySetting.controlEl
			);
			secret.setValue(this.plugin.settings.unsplashKeySecretId);
			secret.onChange((id) => {
				this.plugin.settings.unsplashKeySecretId = id ?? "";
				void this.plugin.saveSettings();
				// Nudge the new-tab view to re-resolve the background now that
				// the configured secret changed.
				this.plugin.settingsObservable.setValue(this.plugin.settings);
			});
		}

		if (
			this.plugin.settings.backgroundTheme ===
			BackgroundTheme.CUSTOM_TOPIC
		) {
			new Setting(containerEl)
				.setName("Custom topic")
				.setDesc(
					`Search term(s) used to pick a random Unsplash photo, e.g. "ocean sunset" or "tokyo at night".`
				)
				.addText((component) => {
					component.setValue(this.plugin.settings.customTopic);
					component.onChange((value) => {
						this.plugin.settings.customTopic = value;
						this.plugin.settingsObservable.setValue(
							this.plugin.settings
						);
						void this.plugin.saveSettings();
					});
				});
		}

		if (this.plugin.settings.backgroundTheme === BackgroundTheme.CUSTOM) {
			new Setting(containerEl)
				.setName("Custom background URL")
				.setDesc(`What URL should be used for the background image?`)
				.addText((component) => {
					component.setValue(this.plugin.settings.customBackground);
					component.onChange((value) => {
						this.plugin.settings.customBackground = value;
						this.plugin.settingsObservable.setValue(
							this.plugin.settings
						);
						void this.plugin.saveSettings();
						this.render();
					});
				});
		}

		new Setting(containerEl)
			.setName("Background image folder")
			.setDesc(
				`When the background theme is "local", a random image from this vault folder (and its subfolders) is shown. Manage the images by adding to or deleting from the folder in your vault.`
			)
			.addSearch((component) => {
				new FolderSuggest(this.app, component.inputEl, (path) => {
					this.plugin.settings.localBackgroundFolder = path;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
				});
				component.setPlaceholder("Backgrounds");
				component.setValue(this.plugin.settings.localBackgroundFolder);
				component.onChange((value) => {
					this.plugin.settings.localBackgroundFolder = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Transfer local image to vault")
			.setDesc(
				`Copy an image from your device into the background image folder above so it joins the rotation. Files are copied in, so the plugin never reads outside your vault.`
			)
			.addButton((component) => {
				component.setButtonText("Add local image");
				component.onClick(() => {
					this.transferLocalImagesToVault();
				});
			});

	}

	/** Search tab: top-left button, providers, nav buttons, inline search. */
	private renderSearchTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show top left search button")
			.setDesc(
				`Should the search button at the top left of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(
					this.plugin.settings.showTopLeftSearchButton
				);
				component.onChange((value) => {
					this.plugin.settings.showTopLeftSearchButton = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		const topLeftSearchProviderSetting = new Setting(containerEl)
			.setName("Top left search provider")
			.setDesc(
				`Which plugin should be utilized for search when clicking the top left button?`
			)
			.setClass("newtab-search-provider")
			.addButton((component) => {
				component.setButtonText("Change");
				component.setTooltip("Choose search provider");
				component.onClick(() => {
					new ChooseSearchProvider(
						this.app,
						this.plugin.settings,
						(result) => {
							this.plugin.settings.topLeftSearchProvider = result;
							this.plugin.settingsObservable.setValue(
								this.plugin.settings
							);
							void this.plugin.saveSettings();
							this.render();
						}
					).open();
				});
			});
		this.renderSelectedProvider(
			topLeftSearchProviderSetting,
			this.plugin.settings.topLeftSearchProvider.display
		);

		new Setting(containerEl)
			.setName("Show navigation buttons")
			.setDesc(
				`Should back and forward navigation buttons be shown at the top of the new tab screen? Helpful for navigating forward again after pressing back lands you here.`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showNavButtons);
				component.onChange((value) => {
					this.plugin.settings.showNavButtons = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		new Setting(containerEl)
			.setName("Show inline search")
			.setDesc(
				`Should the inline search in the middle of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showInlineSearch);
				component.onChange((value) => {
					this.plugin.settings.showInlineSearch = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		const inlineSearchProviderSetting = new Setting(containerEl)
			.setName("Inline search provider")
			.setDesc(
				`Which plugin should be utilized for search when clicking the middle of the screen button?`
			)
			.setClass("newtab-search-provider")
			.addButton((component) => {
				component.setButtonText("Change");
				component.setTooltip("Choose search provider");
				component.onClick(() => {
					new ChooseSearchProvider(
						this.app,
						this.plugin.settings,
						(result) => {
							this.plugin.settings.inlineSearchProvider = result;
							this.plugin.settingsObservable.setValue(
								this.plugin.settings
							);
							void this.plugin.saveSettings();
							this.render();
						}
					).open();
				});
			});
		this.renderSelectedProvider(
			inlineSearchProviderSetting,
			this.plugin.settings.inlineSearchProvider.display
		);

		this.renderAppliedStyle(containerEl, STYLE_TARGET.SEARCH);
	}

	/** Time tab: visibility and 12/24-hour format. */
	private renderTimeTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show time")
			.setDesc(
				`Should the time in the middle of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showTime);
				component.onChange((value) => {
					this.plugin.settings.showTime = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		new Setting(containerEl)
			.setName("Time format")
			.setDesc(`Should the time be in 12-hour format or 24-hour format?`)
			.addDropdown((component) => {
				component.addOption(
					TIME_FORMAT.TWELVE_HOUR,
					TIME_FORMAT.TWELVE_HOUR
				);
				component.addOption(
					TIME_FORMAT.TWENTY_FOUR_HOUR,
					TIME_FORMAT.TWENTY_FOUR_HOUR
				);

				component.setValue(this.plugin.settings.timeFormat);

				component.onChange((value: TIME_FORMAT) => {
					this.plugin.settings.timeFormat = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		this.renderAppliedStyle(containerEl, STYLE_TARGET.TIME);
	}

	/** Greeting tab: visibility, text (markdown), language. */
	private renderGreetingTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show greeting")
			.setDesc(
				`Should the greeting in the middle of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showGreeting);
				component.onChange((value) => {
					this.plugin.settings.showGreeting = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		new Setting(containerEl)
			.setName("Greeting text")
			.setDesc(
				`What text should be displayed as a greeting? Use {{greeting}} for a time-of-day greeting (e.g. Good morning), and markdown like **bold** or *italic* for emphasis.`
			)
			.addText((component) => {
				component.setValue(this.plugin.settings.greetingText);
				component.onChange((value) => {
					this.plugin.settings.greetingText = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Greeting language")
			.setDesc(
				`Language for the {{greeting}} time-of-day phrase. Auto follows Obsidian's display language; pick a specific language to greet in a different one (e.g. English Obsidian, German greeting).`
			)
			.addDropdown((component) => {
				component.addOption(
					GREETING_LANGUAGE_AUTO,
					"Auto (follow Obsidian)"
				);
				for (const code of Object.keys(GREETINGS)) {
					component.addOption(code, LANGUAGE_LABELS[code] ?? code);
				}

				component.setValue(this.plugin.settings.greetingLanguage);

				component.onChange((value) => {
					this.plugin.settings.greetingLanguage = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
				});
			});

		this.renderAppliedStyle(containerEl, STYLE_TARGET.GREETING);
	}

	/** Recent files tab. */
	private renderRecentFilesTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show recent files")
			.setDesc(
				`Should recent files in the middle of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showRecentFiles);
				component.onChange((value) => {
					this.plugin.settings.showRecentFiles = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		this.renderAppliedStyle(containerEl, STYLE_TARGET.RECENT_FILES);
	}

	/** Bookmarks tab: visibility and source group. */
	private renderBookmarksTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show bookmarks")
			.setDesc(
				`Should bookmarks in the middle of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showBookmarks);
				component.onChange((value) => {
					this.plugin.settings.showBookmarks = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		new Setting(containerEl)
			.setName("Bookmarks source")
			.setDesc(
				`Should all bookmarks be displayed or bookmarks from a specific group?`
			)
			.addDropdown((component) => {
				component.addOption(BOOKMARK_SOURCE.ALL, "All bookmarks");
				component.addOption(
					BOOKMARK_SOURCE.GROUP,
					"Bookmarks from group"
				);

				component.setValue(this.plugin.settings.bookmarkSource);
				component.onChange((value: BOOKMARK_SOURCE) => {
					this.plugin.settings.bookmarkSource = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		if (this.plugin.settings.bookmarkSource === BOOKMARK_SOURCE.GROUP) {
			new Setting(containerEl)
				.setName("Bookmarks group")
				.setDesc(`Which group should bookmarks be pulled from?`)
				.addDropdown((component) => {
					getBookmarkGroups(this.app).forEach((group) => {
						component.addOption(group.title, group.path);
					});

					component.setValue(this.plugin.settings.bookmarkGroup);
					component.onChange((value: BOOKMARK_SOURCE) => {
						this.plugin.settings.bookmarkGroup = value;
						this.plugin.settingsObservable.setValue(
							this.plugin.settings
						);
						void this.plugin.saveSettings();
						this.render();
					});
				});
		}

		this.renderAppliedStyle(containerEl, STYLE_TARGET.BOOKMARKS);
	}

	/** Quote tab: visibility and the three quote sources. */
	private renderQuoteTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Show quote")
			.setDesc(
				`Should the quote at the bottom of the new tab screen be displayed?`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.showQuote);
				component.onChange((value) => {
					this.plugin.settings.showQuote = value;
					this.plugin.settingsObservable.setValue(
						this.plugin.settings
					);
					void this.plugin.saveSettings();
					this.render();
				});
			});

		// Quotes are drawn from the union of whichever sources are enabled below.
		const persist = () => {
			this.plugin.settingsObservable.setValue(this.plugin.settings);
			void this.plugin.saveSettings();
		};

		new Setting(containerEl)
			.setName("Online quotes")
			.setDesc(
				`Random quotes from ZenQuotes (requires an internet connection).`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.quoteUseOnline);
				component.onChange((value) => {
					this.plugin.settings.quoteUseOnline = value;
					persist();
				});
			});

		new Setting(containerEl)
			.setName("My quotes")
			.setDesc(
				`Your own quotes, stored in the plugin settings (${this.plugin.settings.customQuotes.length} saved).`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.quoteUseMyQuotes);
				component.onChange((value) => {
					this.plugin.settings.quoteUseMyQuotes = value;
					persist();
				});
			})
			.addButton((component) => {
				component.setButtonText("Edit");
				component.onClick(() => {
					new CustomQuotesModel(
						this.plugin,
						(modifiedCustomQuotes: CustomQuote[]) => {
							this.plugin.settings.customQuotes =
								modifiedCustomQuotes;
							void this.plugin.saveSettings();
							this.render();
						}
					).open();
				});
			});

		new Setting(containerEl)
			.setName("Vault notes")
			.setDesc(
				`Use quotes stored in your notes' frontmatter, selected by tag or folder.`
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.quoteUseVaultNotes);
				component.onChange((value) => {
					this.plugin.settings.quoteUseVaultNotes = value;
					persist();
					this.render();
				});
			});

		if (this.plugin.settings.quoteUseVaultNotes) {
			new Setting(containerEl)
				.setName("Note selection")
				.setDesc(`Find quote notes by tag or by folder.`)
				.addDropdown((component) => {
					component.addOption(VAULT_QUOTE_SELECTION.TAG, "Tag");
					component.addOption(
						VAULT_QUOTE_SELECTION.PATH,
						"Folder (path)"
					);
					component.setValue(
						this.plugin.settings.quoteVaultSelectionMode
					);
					component.onChange((value: VAULT_QUOTE_SELECTION) => {
						this.plugin.settings.quoteVaultSelectionMode = value;
						persist();
						this.render();
					});
				});

			if (
				this.plugin.settings.quoteVaultSelectionMode ===
				VAULT_QUOTE_SELECTION.TAG
			) {
				new Setting(containerEl)
					.setName("Tag")
					.setDesc(
						`Notes carrying this tag (frontmatter or inline) are used as quotes.`
					)
					.addText((component) => {
						component.setPlaceholder("type/note/quote");
						component.setValue(this.plugin.settings.quoteVaultTag);
						component.onChange((value) => {
							this.plugin.settings.quoteVaultTag = value;
							persist();
						});
					});
			} else {
				new Setting(containerEl)
					.setName("Folder")
					.setDesc(
						`Notes in this folder and its subfolders are used as quotes.`
					)
					.addSearch((component) => {
						new FolderSuggest(
							this.app,
							component.inputEl,
							(path) => {
								this.plugin.settings.quoteVaultFolder = path;
								persist();
							}
						);
						component.setPlaceholder("Quotes");
						component.setValue(
							this.plugin.settings.quoteVaultFolder
						);
						component.onChange((value) => {
							this.plugin.settings.quoteVaultFolder = value;
							persist();
						});
					});
			}

			new Setting(containerEl)
				.setName("Quote property")
				.setDesc(`Frontmatter property holding the quote text.`)
				.addText((component) => {
					component.setPlaceholder("Quote");
					component.setValue(
						this.plugin.settings.quoteVaultContentProperty
					);
					component.onChange((value) => {
						this.plugin.settings.quoteVaultContentProperty = value;
						persist();
					});
				});

			new Setting(containerEl)
				.setName("Author property")
				.setDesc(`Frontmatter property holding the author.`)
				.addText((component) => {
					component.setPlaceholder("Author");
					component.setValue(
						this.plugin.settings.quoteVaultAuthorProperty
					);
					component.onChange((value) => {
						this.plugin.settings.quoteVaultAuthorProperty = value;
						persist();
					});
				});
		}

		this.renderAppliedStyle(containerEl, STYLE_TARGET.QUOTE);
	}

	/** Debug tab: developer-console logging toggle. */
	private renderDebugTab(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Debug logging")
			.setDesc(
				createFragment((frag) => {
					frag.appendText(
						"Log background and quote provider activity (Unsplash, ZenQuotes) to the developer console. Leave off unless you're troubleshooting — see the "
					);
					frag.createEl("a", {
						text: "Troubleshooting guide",
						href: "https://github.com/MMoMM-org/obsidian-newtab/blob/main/docs/troubleshooting.md",
					});
					frag.appendText(
						". Takes effect immediately; open a new tab to see log lines."
					);
				})
			)
			.addToggle((component) => {
				component.setValue(this.plugin.settings.debugLogging);
				component.onChange((value) => {
					this.plugin.settings.debugLogging = value;
					setDebugLogging(value);
					void this.plugin.saveSettings();
					// Immediate console feedback so it's obvious the toggle did
					// something even before a new tab is opened.
					if (value) {
						debugLog(
							"debug",
							"logging enabled — open a new tab to see provider activity"
						);
					}
				});
			});
	}
}
