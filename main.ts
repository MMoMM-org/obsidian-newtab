import {
	Notice,
	Platform,
	Plugin,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import { ReactView, NEWTAB_REACT_VIEW } from "./Views/ReactView";
import Observable from "src/Utils/Observable";
import { appInternals } from "src/Types/ObsidianInternals";
import {
	NewTabPluginSettingTab,
	NewTabPluginSettings,
	DEFAULT_SETTINGS,
	migrateQuoteSources,
} from "src/Settings/Settings";
import { setDebugLogging } from "React/Utils/debug";
import { readBeautitabData } from "src/Import/Beautitab";
import { BeautitabImportModal } from "src/Import/BeautitabImportModal";

export default class NewTabPlugin extends Plugin {
	settings: NewTabPluginSettings;
	settingsObservable: Observable<NewTabPluginSettings>;
	/**
	 * Whether a BeautiTab `data.json` was found in this vault at load. Cached so
	 * the settings tab can render the fallback import button synchronously.
	 */
	beautitabDetected = false;
	/** Path of a just-created note, awaiting its file-open to confirm intent. */
	private pendingNewFilePath: string | null = null;
	/** NewTab leaf active when a note was created — the one to replace. */
	private leafToReplace: WorkspaceLeaf | null = null;

	async onload() {
		await this.loadSettings();

		// Apply the persisted debug-logging preference before anything logs.
		setDebugLogging(this.settings.debugLogging);

		this.settingsObservable = new Observable(this.settings);

		this.registerView(
			NEWTAB_REACT_VIEW,
			(leaf) =>
				new ReactView(this.app, this.settingsObservable, leaf, this)
		);

		this.addSettingTab(new NewTabPluginSettingTab(this.app, this));

		// Detect BeautiTab and, on first run, offer a one-time import. Deferred
		// to layout-ready so the modal doesn't open before the workspace exists.
		this.app.workspace.onLayoutReady(() => {
			void this.maybeOfferBeautitabImport();
		});

		this.registerEvent(
			this.app.workspace.on("layout-change", () => this.onLayoutChange())
		);

		// Make "Create new note" (command or Cmd/Ctrl+N) replace the NewTab it's
		// run from, instead of opening a separate tab beside it — Obsidian only
		// auto-replaces leaves of view type "empty", and ours is custom.
		//
		// When a file is created, capture the leaf active *right now* (before
		// the note opens) if it's a NewTab. When that exact file then opens (a
		// genuine new note), detach the captured leaf. Capturing at create time
		// is reliable for both the command and the hotkey, whereas tracking via
		// active-leaf-change misses NewTab leaves hijacked from an empty tab.
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}
				this.pendingNewFilePath = file.path;
				const active = this.app.workspace.getMostRecentLeaf();
				this.leafToReplace =
					active?.view instanceof ReactView ? active : null;
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				const created = this.pendingNewFilePath;
				const leaf = this.leafToReplace;
				this.pendingNewFilePath = null;
				this.leafToReplace = null;
				// Only act on the note that was just created (not on opening an
				// existing file), and only if it didn't already replace the
				// NewTab in place (then the captured leaf is no longer a NewTab).
				if (!file || !created || file.path !== created || !leaf) {
					return;
				}
				if (
					leaf !== this.app.workspace.getMostRecentLeaf() &&
					leaf.view instanceof ReactView
				) {
					leaf.detach();
				}
			})
		);

		if (process.env.NODE_ENV === "development") {
			const internals = appInternals(this.app);
			if (process.env.EMULATE_MOBILE && !Platform.isMobile) {
				internals.emulateMobile(true);
			}

			if (!process.env.EMULATE_MOBILE && Platform.isMobile) {
				internals.emulateMobile(false);
			}
		}
	}

	onunload() {}

	/**
	 * Load data from disk, stored in data.json in plugin folder
	 */
	async loadSettings() {
		const data = ((await this.loadData()) ??
			{}) as Record<string, unknown>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		migrateQuoteSources(this.settings, data);
	}

	/**
	 * Save data to disk, stored in data.json in plugin folder
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Detect BeautiTab in this vault and, on first run only, offer a one-time
	 * import. `beautitabImportOffered` gates the auto-popup (set once it's shown,
	 * whether the user imports or dismisses); the settings-tab fallback button
	 * stays available until the import actually runs
	 * (`beautitabImportCompleted`). `beautitabDetected` is cached for that button.
	 */
	private async maybeOfferBeautitabImport() {
		this.beautitabDetected = (await readBeautitabData(this.app)) !== null;
		if (
			!this.beautitabDetected ||
			this.settings.beautitabImportCompleted ||
			this.settings.beautitabImportOffered
		) {
			return;
		}
		this.settings.beautitabImportOffered = true;
		await this.saveSettings();
		new BeautitabImportModal(this).open();
	}

	/**
	 * Hijack new tabs and show Beauitab
	 */
	private onLayoutChange(): void {
		const leaf = this.app.workspace.getMostRecentLeaf();
		if (leaf?.getViewState().type === "empty") {
			void leaf.setViewState({
				type: NEWTAB_REACT_VIEW,
			});
		}
	}

	/**
	 * Check if the chosen provider is enabled.
	 * If yes: open it via executeCommandById.
	 * If no: notice the user to enable it in the settings.
	 *
	 * When `initialKey` is given (the keystroke that triggered the inline
	 * search), forward it into the switcher's input once that input appears, so
	 * the first character isn't swallowed.
	 */
	openSwitcherCommand(command: string, initialKey?: string): void {
		const pluginID = command.split(":")[0];
		const internals = appInternals(this.app);
		const plugins = internals.plugins.plugins;
		const internalPlugins = internals.internalPlugins.plugins;

		if (!(plugins[pluginID] || internalPlugins[pluginID]?.enabled)) {
			new Notice(
				`Plugin ${pluginID} is not enabled. Please enable it in the settings.`
			);
			return;
		}

		internals.commands.executeCommandById(command);

		if (!initialKey) {
			return;
		}

		// The switcher opens its modal asynchronously and focuses its own input.
		// Forward the triggering character into that input so it isn't lost.
		// Poll across a few animation frames because each provider (core
		// switcher, Omnisearch, …) opens on its own schedule; give up quietly
		// if no input shows up.
		let attempts = 0;
		const forwardKey = () => {
			const el = activeDocument.activeElement;
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement
			) {
				el.value = initialKey;
				el.dispatchEvent(new InputEvent("input", { bubbles: true }));
				try {
					el.setSelectionRange(initialKey.length, initialKey.length);
				} catch {
					// Some input types don't support selection — ignore.
				}
				return;
			}
			if (attempts++ < 20) {
				window.requestAnimationFrame(forwardKey);
			}
		};
		window.requestAnimationFrame(forwardKey);
	}
}
