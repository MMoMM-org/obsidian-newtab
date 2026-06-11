import { App, TFile, normalizePath } from "obsidian";

/**
 * Image extensions treated as usable backgrounds, both for the vault picker and
 * for folder randomization. Lower-case; compared against TFile.extension.
 */
export const IMAGE_EXTENSIONS = [
	"jpg",
	"jpeg",
	"png",
	"webp",
	"gif",
	"avif",
	"bmp",
];

const isImage = (file: TFile): boolean =>
	IMAGE_EXTENSIONS.includes(file.extension.toLowerCase());

/**
 * True when `filePath` sits inside `folder` or any of its subfolders. An empty
 * folder matches nothing here — callers decide what an unset folder means.
 */
const isInFolder = (filePath: string, folder: string): boolean => {
	if (!folder) return false;
	return filePath === folder || filePath.startsWith(`${folder}/`);
};

/**
 * Resolve every image inside the configured background folder (and its
 * subfolders) into displayable `app://` resource URLs.
 *
 * Backgrounds live in the vault as ordinary files (not base64 in data.json);
 * this turns the folder's images into URLs at render time. An empty folder
 * yields no backgrounds.
 */
export const resolveLocalBackgroundUrls = (
	app: App | null | undefined,
	folder: string
): string[] => {
	if (!app || !folder) return [];

	const normalizedFolder = normalizePath(folder);
	const urls: string[] = [];
	for (const file of app.vault.getFiles()) {
		if (isImage(file) && isInFolder(file.path, normalizedFolder)) {
			urls.push(app.vault.getResourcePath(file));
		}
	}
	return urls;
};

export default resolveLocalBackgroundUrls;
