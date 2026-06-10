import { App, TFile, getAllTags } from "obsidian";
import { VAULT_QUOTE_SELECTION } from "src/Types/Enums";
import { Quote } from "./getQuote";
import { debugLog } from "./debug";

export interface VaultQuoteConfig {
	selectionMode: VAULT_QUOTE_SELECTION;
	/** Tag (with or without leading #) selecting quote notes, e.g. "type/note/quote". */
	tag: string;
	/** Folder path selecting quote notes (includes subfolders). Empty = whole vault. */
	folder: string;
	/** Frontmatter property holding the quote text. */
	contentProperty: string;
	/** Frontmatter property holding the author. */
	authorProperty: string;
}

/** Normalize a user-entered tag to the "#a/b" form getAllTags returns. */
const normalizeTag = (tag: string): string => {
	const trimmed = tag.trim().replace(/^#+/, "");
	return trimmed ? `#${trimmed}` : "";
};

const hasTag = (app: App, file: TFile, tag: string): boolean => {
	const cache = app.metadataCache.getFileCache(file);
	return cache ? (getAllTags(cache) ?? []).includes(tag) : false;
};

const inFolder = (file: TFile, folder: string): boolean => {
	const base = folder.trim().replace(/\/+$/, "");
	return base === "" || file.path.startsWith(`${base}/`);
};

/**
 * Resolve quotes from vault notes. Candidate markdown notes are selected by tag
 * or by folder, then the configured frontmatter properties supply the quote
 * text and author. Notes missing the content property are skipped; the author
 * is optional. Reads only the metadata cache, so it's synchronous and cheap.
 * Never throws.
 */
export const getVaultQuotes = (
	app: App | undefined,
	config: VaultQuoteConfig
): Quote[] => {
	if (!app) {
		return [];
	}

	const contentProp = config.contentProperty.trim() || "Quote";
	const authorProp = config.authorProperty.trim() || "Author";

	let candidates: TFile[];
	if (config.selectionMode === VAULT_QUOTE_SELECTION.PATH) {
		candidates = app.vault
			.getMarkdownFiles()
			.filter((file) => inFolder(file, config.folder));
	} else {
		const tag = normalizeTag(config.tag);
		candidates = tag
			? app.vault
					.getMarkdownFiles()
					.filter((file) => hasTag(app, file, tag))
			: [];
	}

	const quotes: Quote[] = [];
	for (const file of candidates) {
		const frontmatter: Record<string, unknown> =
			app.metadataCache.getFileCache(file)?.frontmatter ?? {};
		const content = frontmatter[contentProp];
		if (typeof content !== "string" || !content.trim()) {
			debugLog(
				"quote",
				`vault note skipped (no "${contentProp}" frontmatter property): ${file.path}`
			);
			continue;
		}
		const author = frontmatter[authorProp];
		quotes.push({
			content: content.trim(),
			author: typeof author === "string" ? author.trim() : "",
		});
	}

	const selector =
		config.selectionMode === VAULT_QUOTE_SELECTION.PATH
			? `folder="${config.folder || "(vault root)"}"`
			: `tag="${normalizeTag(config.tag) || "(none)"}"`;
	debugLog(
		"quote",
		`vault notes: mode=${config.selectionMode} ${selector} props=${contentProp}/${authorProp} → ${candidates.length} candidate note(s), ${quotes.length} usable`
	);
	return quotes;
};
