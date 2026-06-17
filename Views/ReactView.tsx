import { App, FileView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import ReactApp from "../React/Components/App/App";
import { ObsidianContext } from "../React/Context/ObsidianAppContext";
import Observable from "src/Utils/Observable";
import { NewTabPluginSettings } from "src/Settings/Settings";
import NewTabPlugin from "main";

export const NEWTAB_REACT_VIEW = "newtab-react-view";

// Obsidian ships a global i18next instance for its own UI strings. We reuse it
// (read-only) for the tab title; declare the minimal surface we touch rather
// than taking on the i18next dependency. Full UI localization is tracked in #25.
declare const i18next: {
	t(key: string, options?: { defaultValue?: string }): string;
};

export class ReactView extends FileView {
	root: Root | null = null;
	app: App;
	settingsObservable: Observable<NewTabPluginSettings>;
	plugin: NewTabPlugin;

	constructor(
		app: App,
		settingsObservable: Observable<NewTabPluginSettings>,
		leaf: WorkspaceLeaf,
		plugin: NewTabPlugin
	) {
		super(leaf);
		this.app = app;
		this.settingsObservable = settingsObservable;
		this.allowNoFile = true;
		this.plugin = plugin;
	}

	getViewType() {
		return NEWTAB_REACT_VIEW;
	}

	getDisplayText() {
		// Follow Obsidian's display language for the tab title by reusing
		// Obsidian's own translation for "New tab" (its built-in empty-tab
		// label). i18next is the global instance Obsidian ships; the
		// defaultValue keeps the English label if the key is ever absent, so
		// this can only improve on the previous hardcoded string.
		return i18next.t("interface.label-new-tab", { defaultValue: "New tab" });
	}

	getIcon() {
		// Lucide "layout-dashboard" — the new tab is a customizable widget
		// dashboard (clock, greeting, search, bookmarks, recents, quote).
		return "layout-dashboard";
	}

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<ObsidianContext.Provider value={this.app}>
				<ReactApp
					settingsObservable={this.settingsObservable}
					plugin={this.plugin}
					leaf={this.leaf}
				/>
			</ObsidianContext.Provider>
		);
		this.containerEl.addClass("newtab");
	}

	async onClose() {
		// Unmount synchronously, before Obsidian reuses this leaf. When the
		// NewTab view is the active leaf and the plugin is disabled, Obsidian
		// re-renders the leaf immediately; a deferred (setTimeout) unmount would
		// fire afterwards and wipe whatever Obsidian put there, blanking the
		// pane with no error. Clearing contentEl is the standard React-in-
		// Obsidian teardown.
		// The try/catch guards React's "synchronous unmount while rendering"
		// throw, which Obsidian's disable path otherwise lets break the UI.
		try {
			this.root?.unmount();
		} catch {
			// Already torn down / mid-render — safe to ignore.
		}
		this.root = null;
		this.contentEl.empty();
	}
}
