import { Notice, Plugin, requestUrl } from "obsidian";
import { ReactView, NEWTAB_REACT_VIEW } from "./Views/ReactView";
import Observable from "src/Utils/Observable";
import {
	NewTabPluginSettingTab,
	NewTabPluginSettings,
	DEFAULT_SETTINGS,
} from "src/Settings/Settings";

export default class NewTabPlugin extends Plugin {
	settings: NewTabPluginSettings;
	settingsObservable: Observable;

	async onload() {
		await this.loadSettings();

		this.versionCheck();

		this.settingsObservable = new Observable(this.settings);

		this.registerView(
			NEWTAB_REACT_VIEW,
			(leaf) =>
				new ReactView(this.app, this.settingsObservable, leaf, this)
		);

		this.addSettingTab(new NewTabPluginSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
				this.onLayoutChange.bind(this)
			)
		);

		if (process.env.NODE_ENV === "development") {
			// @ts-ignore
			if (process.env.EMULATE_MOBILE && !this.app.isMobile) {
				// @ts-ignore
				this.app.emulateMobile(true);
			}

			// @ts-ignore
			if (!process.env.EMULATE_MOBILE && this.app.isMobile) {
				// @ts-ignore
				this.app.emulateMobile(false);
			}
		}
	}

	onunload() {}

	/**
	 * Load data from disk, stored in data.json in plugin folder
	 */
	async loadSettings() {
		const data = (await this.loadData()) || {};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	/**
	 * Save data to disk, stored in data.json in plugin folder
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Check the local plugin version against github. If there is a new version, notify the user.
	 */
	async versionCheck() {
		const localVersion = process.env.PLUGIN_VERSION;

		// Read a branch's published version without crashing on a missing or
		// private repo. requestUrl rejects on any non-2xx response, so a 404
		// (private repo with no auth, or a branch that doesn't exist) must be
		// tolerated here — otherwise the rejection escapes onload as an
		// uncaught promise error.
		const fetchVersion = async (
			branch: string
		): Promise<string | undefined> => {
			try {
				const res = await requestUrl({
					url: `https://raw.githubusercontent.com/MMoMM-org/obsidian-newtab/${branch}/package.json`,
					throw: false,
				});
				if (res.status === 200) {
					return res.json.version;
				}
			} catch {
				// Offline or the request still threw — skip the update check.
			}
			return undefined;
		};

		const stableVersion = await fetchVersion("main");
		const betaVersion = await fetchVersion("beta");

		// Only notify when a newer remote version was actually retrieved; never
		// nag when the check could not run (e.g. private repo or offline).
		if (localVersion?.includes("beta")) {
			if (betaVersion && localVersion !== betaVersion) {
				new Notice(
					"There is a beta update available for the NewTab plugin. Please update to the latest version to get the latest features!",
					0
				);
			}
		} else if (stableVersion && localVersion !== stableVersion) {
			new Notice(
				"There is an update available for the NewTab plugin. Please update to the latest version to get the latest features!",
				0
			);
		}
	}

	/**
	 * Hijack new tabs and show Beauitab
	 */
	private onLayoutChange(): void {
		const leaf = this.app.workspace.getMostRecentLeaf();
		if (leaf?.getViewState().type === "empty") {
			leaf.setViewState({
				type: NEWTAB_REACT_VIEW,
			});
		}
	}

	/**
	 * Check if the choosen provider is enabled
	 * If yes: open it by using executeCommandById
	 * If no: Notice the user and tell them to enable it in the settings
	 */
	openSwitcherCommand(command: string): void {
		const pluginID = command.split(":")[0];
		//@ts-ignore
		const plugins = this.app.plugins.plugins;
		//@ts-ignore
		const internalPlugins = this.app.internalPlugins.plugins;

		if (plugins[pluginID] || internalPlugins[pluginID]?.enabled) {
			//@ts-ignore
			this.app.commands.executeCommandById(command);
		} else {
			new Notice(
				`Plugin ${pluginID} is not enabled. Please enable it in the settings.`
			);
		}
	}
}
