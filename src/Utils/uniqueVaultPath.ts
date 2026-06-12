import { App, normalizePath } from "obsidian";

/**
 * A vault path inside `folder` for `filename` that doesn't collide with an
 * existing file, appending " 1", " 2", … before the extension as needed.
 */
export const uniqueVaultPath = (
	app: App,
	folder: string,
	filename: string
): string => {
	const dot = filename.lastIndexOf(".");
	const base = dot === -1 ? filename : filename.slice(0, dot);
	const ext = dot === -1 ? "" : filename.slice(dot);

	let candidate = normalizePath(`${folder}/${filename}`);
	let i = 1;
	while (app.vault.getAbstractFileByPath(candidate)) {
		candidate = normalizePath(`${folder}/${base} ${i}${ext}`);
		i++;
	}
	return candidate;
};
