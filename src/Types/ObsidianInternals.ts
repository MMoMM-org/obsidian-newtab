import { App, WorkspaceLeaf } from "obsidian";

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

/**
 * True when the community plugin with `id` is currently enabled. `plugins.plugins`
 * only holds an entry once a plugin is loaded, so presence == enabled.
 */
export const isCommunityPluginEnabled = (app: App, id: string): boolean =>
	id in appInternals(app).plugins.plugins;

/** The core Bookmarks plugin's items, or `[]` when it is disabled. */
export const getBookmarkItems = (app: App): BookmarkItem[] => {
	const instance = appInternals(app).internalPlugins.plugins.bookmarks
		?.instance as BookmarksInstance | undefined;
	return instance?.items ?? [];
};

/**
 * Each leaf keeps its own back/forward navigation stacks. The object isn't in
 * `obsidian.d.ts`; we read the two stack lengths (to enable/disable buttons)
 * and call `back()`/`forward()` to navigate. `length` is all we need from the
 * stacks, so they're typed as bare arrays.
 */
interface LeafHistory {
	back(): void;
	forward(): void;
	backHistory: unknown[];
	forwardHistory: unknown[];
}

/**
 * The navigation history of a workspace leaf, or `null` if the build doesn't
 * expose it (the API is internal, so guard rather than assume it's present).
 */
export const getLeafHistory = (
	leaf: WorkspaceLeaf | null | undefined
): LeafHistory | null => {
	const history = (leaf as (WorkspaceLeaf & { history?: LeafHistory }) | null)
		?.history;
	return history && typeof history.back === "function" ? history : null;
};
