import { App, FileView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import ReactApp from "../React/Components/App/App";
import { ObsidianContext } from "../React/Context/ObsidianAppContext";
import Observable from "src/Utils/Observable";
import NewTabPlugin from "main";

export const NEWTAB_REACT_VIEW = "newtab-react-view";

export class ReactView extends FileView {
	root: Root | null = null;
	app: App;
	settingsObservable: Observable;
	plugin: NewTabPlugin;

	constructor(
		app: App,
		settingsObservable: Observable,
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
		return "";
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
		// Defer the React unmount out of the current call stack. Obsidian tears
		// the view down from inside a workspace render/layout cycle (notably
		// when the plugin is disabled from the settings pane), and unmounting a
		// root synchronously there throws "Attempted to synchronously unmount a
		// root while React was already rendering" — which bubbles up and breaks
		// the settings dialog. A 0ms timeout moves it to a clean tick.
		const root = this.root;
		this.root = null;
		if (root) {
			setTimeout(() => root.unmount());
		}
	}
}
