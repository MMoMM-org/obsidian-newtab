import { App, FileView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import ReactApp from "../React/Components/App/App";
import { ObsidianContext } from "../React/Context/ObsidianAppContext";
import Observable from "src/Utils/Observable";
import { NewTabPluginSettings } from "src/Settings/Settings";
import NewTabPlugin from "main";

export const NEWTAB_REACT_VIEW = "newtab-react-view";

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
		return "New tab";
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
