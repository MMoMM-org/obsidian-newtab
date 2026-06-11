import { App } from "obsidian";

/**
 * Minimal typed views over the Obsidian internal / undocumented APIs this
 * plugin actually touches. They aren't in `obsidian.d.ts`, so without these
 * declarations every access goes through `any` (which trips the `no-unsafe-*`
 * rules and forces `@ts-ignore`). Keep the surface as small as what we use.
 */

/**
 * A single entry from the core Bookmarks plugin's item tree. Fields are
 * optional because the shape varies by `type` ("file", "group", "search", …);
 * we only read `path`/`items`/`title` and only for the types we care about.
 */
export interface BookmarkItem {
	type: string;
	path?: string;
	title?: string;
	items?: BookmarkItem[];
}

interface BookmarksInstance {
	items: BookmarkItem[];
}

interface InternalPluginEntry {
	enabled: boolean;
	instance?: unknown;
}

interface AppInternals {
	/** Community plugins, keyed by plugin id (present only when enabled). */
	plugins: { plugins: Record<string, unknown> };
	/** Core ("internal") plugins, keyed by id. */
	internalPlugins: {
		plugins: Record<string, InternalPluginEntry | undefined>;
	};
	commands: {
		commands: Record<string, { name: string }>;
		executeCommandById(id: string): boolean;
	};
	/** Dev-only: toggle the mobile emulation used during development. */
	emulateMobile(value: boolean): void;
}

/** View an `App` through the internal APIs declared above. */
export const appInternals = (app: App): App & AppInternals =>
	app as App & AppInternals;

/** The core Bookmarks plugin's items, or `[]` when it is disabled. */
export const getBookmarkItems = (app: App): BookmarkItem[] => {
	const instance = appInternals(app).internalPlugins.plugins.bookmarks
		?.instance as BookmarksInstance | undefined;
	return instance?.items ?? [];
};
