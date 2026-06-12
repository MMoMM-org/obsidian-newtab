import { App, normalizePath } from "obsidian";
import type NewTabPlugin from "main";
import type { NewTabPluginSettings } from "src/Settings/Settings";
import {
	BOOKMARK_SOURCE,
	BackgroundTheme,
	QUOTE_SOURCE,
	TIME_FORMAT,
} from "src/Types/Enums";
import { CustomQuote, SearchProvider } from "src/Types/Interfaces";
import { themeUsesUnsplash } from "src/Utils/themeUsesUnsplash";
import { uniqueVaultPath } from "src/Utils/uniqueVaultPath";

/**
 * BeautiTab and its Mara-Li fork share plugin id `beautitab`, so their settings
 * live at the same path: `<configDir>/plugins/beautitab/data.json`.
 */
export const BEAUTITAB_PLUGIN_ID = "beautitab";

/** BeautiTab's "online quotes" enum value (New Tab calls the same thing "Online quotes"). */
const BEAUTITAB_QUOTE_ONLINE = "Quoteable";

/** SecretStorage id the imported Unsplash key is stored under. */
export const IMPORTED_UNSPLASH_SECRET_ID =
	"Unsplash access key (imported from Beautitab)";

/** Default vault folder for extracted BeautiTab background images. */
export const DEFAULT_IMPORT_IMAGE_FOLDER = "Beautitab backgrounds";

/** The result of the pure mapping step — no filesystem or SecretStorage touched. */
export interface MappedImport {
	/** New Tab settings to merge non-destructively over the current ones. */
	settings: Partial<NewTabPluginSettings>;
	/** BeautiTab `localBackgrounds` data-URIs, to be extracted to files by the orchestrator. */
	images: string[];
	/** Fork-only Unsplash `apiKey` (trimmed, non-empty), or null when absent. */
	apiKey: string | null;
}

/** Outcome reported back to the UI so it can show the right notices. */
export interface ImportResult {
	imported: boolean;
	imageCount: number;
	keyImported: boolean;
	/** The resulting theme needs an Unsplash key but none is configured. */
	needsUnsplashKey: boolean;
}

const asString = (value: unknown): string | undefined =>
	typeof value === "string" ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
	typeof value === "boolean" ? value : undefined;

/** Accept a string only when it is one of the allowed enum values. */
const asEnum = <T extends string>(
	value: unknown,
	allowed: readonly T[]
): T | undefined =>
	typeof value === "string" && (allowed as readonly string[]).includes(value)
		? (value as T)
		: undefined;

const asProvider = (value: unknown): SearchProvider | undefined => {
	if (value && typeof value === "object") {
		const o = value as Record<string, unknown>;
		if (typeof o.command === "string" && typeof o.display === "string") {
			return { command: o.command, display: o.display };
		}
	}
	return undefined;
};

const asQuotes = (value: unknown): CustomQuote[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}
	return value.filter(
		(q): q is CustomQuote =>
			!!q &&
			typeof q === "object" &&
			typeof (q as CustomQuote).text === "string" &&
			typeof (q as CustomQuote).author === "string"
	);
};

/**
 * Map a raw BeautiTab `data.json` object onto New Tab settings. Pure: reads each
 * known key defensively (falling back to "absent" — i.e. New Tab's default — on
 * a missing or wrong-typed value) and ignores unknown keys. This single path
 * covers both the 18-key original and the 20-key Mara-Li fork.
 */
export const mapBeautitabSettings = (
	raw: Record<string, unknown>
): MappedImport => {
	const settings: Partial<NewTabPluginSettings> = {};
	const assign = <K extends keyof NewTabPluginSettings>(
		key: K,
		value: NewTabPluginSettings[K] | undefined
	): void => {
		if (value !== undefined) {
			settings[key] = value;
		}
	};

	// Direct copies — same name, type, and semantics in both plugins.
	assign(
		"backgroundTheme",
		asEnum(raw.backgroundTheme, Object.values(BackgroundTheme))
	);
	assign("customBackground", asString(raw.customBackground));
	assign("showTopLeftSearchButton", asBoolean(raw.showTopLeftSearchButton));
	assign("topLeftSearchProvider", asProvider(raw.topLeftSearchProvider));
	assign("showTime", asBoolean(raw.showTime));
	assign("timeFormat", asEnum(raw.timeFormat, Object.values(TIME_FORMAT)));
	assign("showGreeting", asBoolean(raw.showGreeting));
	assign("greetingText", asString(raw.greetingText));
	assign("showInlineSearch", asBoolean(raw.showInlineSearch));
	assign("inlineSearchProvider", asProvider(raw.inlineSearchProvider));
	assign("showRecentFiles", asBoolean(raw.showRecentFiles));
	assign("showBookmarks", asBoolean(raw.showBookmarks));
	assign(
		"bookmarkSource",
		asEnum(raw.bookmarkSource, Object.values(BOOKMARK_SOURCE))
	);
	assign("bookmarkGroup", asString(raw.bookmarkGroup));
	assign("showQuote", asBoolean(raw.showQuote));
	assign("customQuotes", asQuotes(raw.customQuotes));

	// BeautiTab's single-select `quoteSource` → New Tab's per-source toggles.
	// New Tab's own migrateQuoteSources does NOT know BeautiTab's "Quoteable"
	// value, so the mapping is made explicit here.
	const quoteSource = asString(raw.quoteSource);
	if (
		quoteSource === BEAUTITAB_QUOTE_ONLINE ||
		quoteSource === QUOTE_SOURCE.BOTH
	) {
		settings.quoteUseOnline = true;
	}
	if (
		quoteSource === QUOTE_SOURCE.MY_QUOTES ||
		quoteSource === QUOTE_SOURCE.BOTH
	) {
		settings.quoteUseMyQuotes = true;
	}

	// Local backgrounds are stored inline as base64 data-URIs; collect them for
	// the orchestrator to write out as real files.
	const images = Array.isArray(raw.localBackgrounds)
		? raw.localBackgrounds.filter((u): u is string => typeof u === "string")
		: [];

	// Fork-only Unsplash key (plaintext in data.json) — routed to SecretStorage
	// by the orchestrator, never copied into New Tab's data.json.
	const trimmedKey = asString(raw.apiKey)?.trim();
	const apiKey = trimmedKey ? trimmedKey : null;

	return { settings, images, apiKey };
};

/**
 * Read BeautiTab's `data.json` via the vault adapter. Returns the parsed object,
 * or null when the file is absent, unreadable, or not a JSON object.
 */
export const readBeautitabData = async (
	app: App
): Promise<Record<string, unknown> | null> => {
	const path = normalizePath(
		`${app.vault.configDir}/plugins/${BEAUTITAB_PLUGIN_ID}/data.json`
	);
	try {
		if (!(await app.vault.adapter.exists(path))) {
			return null;
		}
		const parsed: unknown = JSON.parse(await app.vault.adapter.read(path));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
		return null;
	} catch {
		return null;
	}
};

/** Decode a `data:...;base64,XXXX` URI to bytes, or null if it can't be parsed. */
const decodeDataUri = (uri: string): Uint8Array | null => {
	const comma = uri.indexOf(",");
	if (comma === -1) {
		return null;
	}
	try {
		const binary = atob(uri.slice(comma + 1));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return null;
	}
};

/**
 * Determine the real image format from the leading bytes. BeautiTab's data-URIs
 * are all mislabelled `image/png` regardless of the actual encoding, so we sniff
 * rather than trust the MIME prefix. Falls back to "png".
 */
const sniffImageExtension = (bytes: Uint8Array): string => {
	const starts = (...sig: number[]): boolean =>
		sig.every((b, i) => bytes[i] === b);
	// RIFF....WEBP
	if (
		bytes.length >= 12 &&
		starts(0x52, 0x49, 0x46, 0x46) &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return "webp";
	}
	if (starts(0xff, 0xd8, 0xff)) {
		return "jpg";
	}
	if (starts(0x89, 0x50, 0x4e, 0x47)) {
		return "png";
	}
	if (starts(0x47, 0x49, 0x46, 0x38)) {
		return "gif";
	}
	return "png";
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	return buffer;
};

/**
 * Decode BeautiTab's inline base64 backgrounds and write them as real image
 * files into `folder` (created if needed). Returns the written vault paths.
 */
export const extractLocalBackgrounds = async (
	app: App,
	dataUris: string[],
	folder: string
): Promise<string[]> => {
	if (dataUris.length === 0) {
		return [];
	}
	const normalizedFolder = normalizePath(folder);
	if (!app.vault.getAbstractFileByPath(normalizedFolder)) {
		await app.vault.createFolder(normalizedFolder);
	}

	const written: string[] = [];
	let index = 0;
	for (const uri of dataUris) {
		const bytes = decodeDataUri(uri);
		if (!bytes) {
			continue;
		}
		index++;
		const path = uniqueVaultPath(
			app,
			normalizedFolder,
			`beautitab-background-${index}.${sniffImageExtension(bytes)}`
		);
		await app.vault.createBinary(path, toArrayBuffer(bytes));
		written.push(path);
	}
	return written;
};

/**
 * Run the one-time BeautiTab → New Tab import: read, map, extract local
 * backgrounds into `folder`, stash any Unsplash key in SecretStorage, then merge
 * the mapped settings non-destructively over the current ones and persist.
 */
export const importFromBeautitab = async (
	plugin: NewTabPlugin,
	folder: string
): Promise<ImportResult> => {
	const raw = await readBeautitabData(plugin.app);
	if (!raw) {
		return {
			imported: false,
			imageCount: 0,
			keyImported: false,
			needsUnsplashKey: false,
		};
	}

	const { settings, images, apiKey } = mapBeautitabSettings(raw);

	// Extract inline backgrounds to the chosen folder; only point New Tab at it
	// if at least one image actually landed there.
	let imageCount = 0;
	const targetFolder = folder.trim() || DEFAULT_IMPORT_IMAGE_FOLDER;
	if (images.length > 0) {
		const written = await extractLocalBackgrounds(
			plugin.app,
			images,
			targetFolder
		);
		imageCount = written.length;
		if (written.length > 0) {
			settings.localBackgroundFolder = normalizePath(targetFolder);
		}
	}

	// Move the plaintext Unsplash key into Obsidian's secret store; persist only
	// the secret id in settings.
	let keyImported = false;
	if (apiKey) {
		plugin.app.secretStorage.setSecret(IMPORTED_UNSPLASH_SECRET_ID, apiKey);
		settings.unsplashKeySecretId = IMPORTED_UNSPLASH_SECRET_ID;
		keyImported = true;
	}

	Object.assign(plugin.settings, settings);
	plugin.settings.beautitabImportCompleted = true;
	await plugin.saveSettings();
	plugin.settingsObservable.setValue(plugin.settings);

	const needsUnsplashKey =
		themeUsesUnsplash(plugin.settings.backgroundTheme) &&
		!plugin.settings.unsplashKeySecretId;

	return { imported: true, imageCount, keyImported, needsUnsplashKey };
};
