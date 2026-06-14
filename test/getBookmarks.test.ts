import { describe, expect, it, vi } from "vitest";
import { App, createMockTFile } from "./__mocks__/obsidian";
import { getBookmarks, getBookmarkGroups } from "../React/Utils/getBookmarks";
import type { BookmarkItem } from "../src/Types/ObsidianInternals";
import { BOOKMARK_SOURCE } from "../src/Types/Enums";
import type { NewTabPluginSettings } from "../src/Settings/Settings";

type BookmarksApp = Parameters<typeof getBookmarks>[0];
type GroupsApp = Parameters<typeof getBookmarkGroups>[0];

/**
 * Build a mock App exposing the core Bookmarks plugin's item tree and a vault
 * that resolves any path to a stub file (so file bookmarks resolve unless the
 * path is listed in `unresolved`).
 */
const makeApp = (
	items: BookmarkItem[] | undefined,
	unresolved: string[] = [],
): BookmarksApp => {
	const app = new App();
	app.vault.getAbstractFileByPath = vi.fn((path: string) =>
		unresolved.includes(path) ? null : createMockTFile({ path }),
	);
	(app as unknown as Record<string, unknown>).internalPlugins = {
		plugins: {
			bookmarks: items
				? { enabled: true, instance: { items } }
				: undefined,
		},
	};
	return app as unknown as BookmarksApp;
};

const settings = (
	source: BOOKMARK_SOURCE,
	group = "",
): NewTabPluginSettings =>
	({ bookmarkSource: source, bookmarkGroup: group }) as NewTabPluginSettings;

const file = (path: string): BookmarkItem => ({ type: "file", path });
const group = (title: string, items: BookmarkItem[]): BookmarkItem => ({
	type: "group",
	title,
	items,
});

describe("getBookmarks", () => {
	it("returns an empty list when there is no app", () => {
		expect(getBookmarks(undefined, settings(BOOKMARK_SOURCE.ALL))).toEqual([]);
	});

	it("returns an empty list when the bookmarks plugin is disabled", () => {
		const app = makeApp(undefined);
		expect(getBookmarks(app, settings(BOOKMARK_SOURCE.ALL))).toEqual([]);
	});

	describe("ALL source", () => {
		it("flattens nested groups and resolves file bookmarks", () => {
			const app = makeApp([
				file("a.md"),
				group("Work", [file("b.md"), group("Deep", [file("c.md")])]),
			]);
			const paths = getBookmarks(app, settings(BOOKMARK_SOURCE.ALL)).map(
				(f) => f.path,
			);
			expect(paths).toEqual(["a.md", "b.md", "c.md"]);
		});

		it("ignores non-file items such as searches", () => {
			const app = makeApp([file("a.md"), { type: "search" } as BookmarkItem]);
			expect(
				getBookmarks(app, settings(BOOKMARK_SOURCE.ALL)).map((f) => f.path),
			).toEqual(["a.md"]);
		});

		it("drops bookmarks whose path no longer resolves to a file", () => {
			const app = makeApp([file("a.md"), file("gone.md")], ["gone.md"]);
			expect(
				getBookmarks(app, settings(BOOKMARK_SOURCE.ALL)).map((f) => f.path),
			).toEqual(["a.md"]);
		});
	});

	describe("GROUP source", () => {
		it("returns only the named group's bookmarks", () => {
			const app = makeApp([
				file("root.md"),
				group("Work", [file("w1.md"), file("w2.md")]),
				group("Personal", [file("p1.md")]),
			]);
			expect(
				getBookmarks(app, settings(BOOKMARK_SOURCE.GROUP, "Work")).map(
					(f) => f.path,
				),
			).toEqual(["w1.md", "w2.md"]);
		});

		it("finds a nested group by name", () => {
			const app = makeApp([
				group("Outer", [group("Inner", [file("i.md")])]),
			]);
			expect(
				getBookmarks(app, settings(BOOKMARK_SOURCE.GROUP, "Inner")).map(
					(f) => f.path,
				),
			).toEqual(["i.md"]);
		});

		it("returns an empty list when the group is not found", () => {
			const app = makeApp([group("Work", [file("w.md")])]);
			expect(
				getBookmarks(app, settings(BOOKMARK_SOURCE.GROUP, "Missing")),
			).toEqual([]);
		});
	});
});

describe("getBookmarkGroups", () => {
	it("returns all groups with nested paths", () => {
		const app = makeApp([
			file("a.md"),
			group("Work", [group("Projects", [file("p.md")]), file("w.md")]),
			group("Personal", []),
		]);
		expect(getBookmarkGroups(app as unknown as GroupsApp)).toEqual([
			{ title: "Work", path: "Work" },
			{ title: "Projects", path: "Work/Projects" },
			{ title: "Personal", path: "Personal" },
		]);
	});

	it("returns an empty list when there are no groups", () => {
		const app = makeApp([file("a.md")]);
		expect(getBookmarkGroups(app as unknown as GroupsApp)).toEqual([]);
	});
});
