import { App, TAbstractFile } from "obsidian";
import { NewTabPluginSettings } from "src/Settings/Settings";
import { BOOKMARK_SOURCE } from "src/Types/Enums";
import { BookmarkItem, getBookmarkItems } from "src/Types/ObsidianInternals";

interface BookmarkGroup {
	title: string;
	path: string;
}

/**
 * Recursively collects all file bookmarks, descending into groups.
 */
const flattenBookmarks = (items: BookmarkItem[]): BookmarkItem[] => {
	let flattedBookmarks: BookmarkItem[] = [];

	items.forEach((item) => {
		if (item.type === "file") {
			flattedBookmarks.push(item);
		} else if (item.type === "group" && Array.isArray(item.items)) {
			flattedBookmarks = flattedBookmarks.concat(
				flattenBookmarks(item.items)
			);
		}
	});

	return flattedBookmarks;
};

/**
 * Finds a group by name and then returns its (flattened) bookmarks.
 */
const getBookmarksByGroupName = (
	title: string,
	items: BookmarkItem[]
): BookmarkItem[] => {
	let flattedBookmarks: BookmarkItem[] = [];

	items.forEach((item) => {
		if (item.type === "group" && Array.isArray(item.items)) {
			if (item.title === title) {
				flattedBookmarks = flattenBookmarks(item.items);
			} else {
				const bookmarks = getBookmarksByGroupName(title, item.items);
				if (bookmarks.length > 0) {
					flattedBookmarks = bookmarks;
				}
			}
		}
	});

	return flattedBookmarks;
};

/**
 * Gets a list of bookmarks depending on settings. It will either get all
 * bookmarks or bookmarks in a specific group.
 * @param app
 * @param settings
 */
export const getBookmarks = (
	app: App | undefined,
	settings: NewTabPluginSettings
): TAbstractFile[] => {
	if (!app) {
		return [];
	}

	const allItems = getBookmarkItems(app);
	const bookmarks =
		settings.bookmarkSource === BOOKMARK_SOURCE.GROUP
			? getBookmarksByGroupName(settings.bookmarkGroup, allItems)
			: flattenBookmarks(allItems);

	return bookmarks
		.map((bookmark) =>
			bookmark.type === "file" && bookmark.path
				? app.vault.getAbstractFileByPath(bookmark.path)
				: null
		)
		.filter((file): file is TAbstractFile => file !== null);
};

/**
 * Recursive function to return all bookmark groups with their paths.
 */
const flattenBookmarkGroups = (
	items: BookmarkItem[],
	parentPath: string | null = null
): BookmarkGroup[] => {
	let flattedGroups: BookmarkGroup[] = [];

	items.forEach((item) => {
		if (item.type === "group" && Array.isArray(item.items)) {
			const title = item.title ?? "";
			const path = parentPath ? `${parentPath}/${title}` : title;
			flattedGroups.push({ title, path });
			flattedGroups = flattedGroups.concat(
				flattenBookmarkGroups(item.items, path)
			);
		}
	});

	return flattedGroups;
};

/**
 * Gets a list of all bookmark groups.
 * @param app
 */
export const getBookmarkGroups = (app: App): BookmarkGroup[] => {
	return flattenBookmarkGroups(getBookmarkItems(app));
};
