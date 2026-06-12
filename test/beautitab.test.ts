import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./__mocks__/obsidian";
import {
	BEAUTITAB_PLUGIN_ID,
	DEFAULT_IMPORT_IMAGE_FOLDER,
	IMPORTED_UNSPLASH_SECRET_ID,
	extractLocalBackgrounds,
	importFromBeautitab,
	isBeautitabEnabled,
	mapBeautitabSettings,
	readBeautitabData,
} from "../src/Import/Beautitab";
import { BackgroundTheme } from "../src/Types/Enums";
import type { NewTabPluginSettings } from "../src/Settings/Settings";

// The original BeautiTab (andrewmcgivery, ≤ 1.6.1): 18 persisted keys, no apiKey.
const originalFixture: Record<string, unknown> = {
	backgroundTheme: "summer",
	customBackground: "",
	localBackgrounds: [],
	showTopLeftSearchButton: true,
	topLeftSearchProvider: {
		command: "switcher:open",
		display: "Quick switcher",
	},
	showTime: true,
	timeFormat: "12-hour",
	showGreeting: true,
	greetingText: "Hello, Beautiful.",
	showInlineSearch: true,
	inlineSearchProvider: {
		command: "omnisearch:open",
		display: "Omnisearch",
	},
	showRecentFiles: true,
	showBookmarks: false,
	bookmarkSource: "all",
	bookmarkGroup: "",
	showQuote: true,
	quoteSource: "My quotes",
	customQuotes: [{ text: "Stay hungry.", author: "Jobs" }],
};

// The Mara-Li fork (the user's real build): 18 original keys PLUS apiKey
// (plaintext Unsplash key — REDACTED here) and a transient cachedBackground.
// Modelled on a real fork data.json; greetingText keeps its escaped backslash.
const forkFixture: Record<string, unknown> = {
	backgroundTheme: "spring",
	customBackground: "",
	localBackgrounds: [],
	showTopLeftSearchButton: true,
	topLeftSearchProvider: {
		command: "darlal-switcher-plus:switcher-plus:open",
		display: "Quick Switcher++: Open in Standard Mode",
	},
	showTime: true,
	timeFormat: "24-hour",
	showGreeting: true,
	greetingText: "魔王様ようこそ \\ Maō-sama yōkoso",
	showInlineSearch: true,
	inlineSearchProvider: {
		command: "darlal-switcher-plus:switcher-plus:open",
		display: "Quick Switcher++: Open in Standard Mode",
	},
	showRecentFiles: true,
	showBookmarks: true,
	bookmarkSource: "all",
	bookmarkGroup: "",
	showQuote: true,
	quoteSource: "Quoteable",
	customQuotes: [],
	apiKey: "REDACTED-DUMMY-UNSPLASH-KEY",
	cachedBackground: {
		url: "https://images.unsplash.com/photo-1491036775913",
		date: "2026-06-07T14:57:32.934Z",
		theme: "spring",
	},
};

describe("mapBeautitabSettings", () => {
	it("direct-copies shared fields from the original schema", () => {
		const { settings } = mapBeautitabSettings(originalFixture);
		expect(settings.backgroundTheme).toBe("summer");
		expect(settings.timeFormat).toBe("12-hour");
		expect(settings.bookmarkSource).toBe("all");
		expect(settings.showBookmarks).toBe(false);
		expect(settings.topLeftSearchProvider).toEqual({
			command: "switcher:open",
			display: "Quick switcher",
		});
		expect(settings.customQuotes).toEqual([
			{ text: "Stay hungry.", author: "Jobs" },
		]);
	});

	it("maps quoteSource 'My quotes' to the my-quotes toggle only", () => {
		const { settings } = mapBeautitabSettings(originalFixture);
		expect(settings.quoteUseMyQuotes).toBe(true);
		expect(settings.quoteUseOnline).toBeUndefined();
	});

	it("maps the fork's 'Quoteable' to the online toggle (migrateQuoteSources can't)", () => {
		const { settings } = mapBeautitabSettings(forkFixture);
		expect(settings.quoteUseOnline).toBe(true);
		expect(settings.quoteUseMyQuotes).toBeUndefined();
	});

	it("maps 'Both' to both quote toggles", () => {
		const { settings } = mapBeautitabSettings({
			...originalFixture,
			quoteSource: "Both",
		});
		expect(settings.quoteUseOnline).toBe(true);
		expect(settings.quoteUseMyQuotes).toBe(true);
	});

	it("passes the fork apiKey through, and reports null for the original", () => {
		expect(mapBeautitabSettings(forkFixture).apiKey).toBe(
			"REDACTED-DUMMY-UNSPLASH-KEY"
		);
		expect(mapBeautitabSettings(originalFixture).apiKey).toBeNull();
	});

	it("treats an empty apiKey as no key", () => {
		expect(
			mapBeautitabSettings({ ...forkFixture, apiKey: "   " }).apiKey
		).toBeNull();
	});

	it("preserves an escaped backslash in greetingText verbatim", () => {
		const { settings } = mapBeautitabSettings(forkFixture);
		expect(settings.greetingText).toBe("魔王様ようこそ \\ Maō-sama yōkoso");
	});

	it("never carries New-Tab-only fields (no source in BeautiTab)", () => {
		const { settings } = mapBeautitabSettings(forkFixture);
		expect(settings).not.toHaveProperty("customTopic");
		expect(settings).not.toHaveProperty("greetingLanguage");
		expect(settings).not.toHaveProperty("quoteUseVaultNotes");
		expect(settings).not.toHaveProperty("debugLogging");
	});

	it("ignores the transient cachedBackground and unknown keys", () => {
		const { settings } = mapBeautitabSettings({
			...forkFixture,
			somethingNew: 42,
		});
		expect(settings).not.toHaveProperty("cachedBackground");
		expect(settings).not.toHaveProperty("somethingNew");
	});

	it("falls back to absent on wrong-typed and invalid-enum values", () => {
		const { settings } = mapBeautitabSettings({
			showTime: "yes", // wrong type → skipped
			backgroundTheme: "not-a-theme", // not in enum → skipped
			timeFormat: "12-hour",
		});
		expect(settings).not.toHaveProperty("showTime");
		expect(settings).not.toHaveProperty("backgroundTheme");
		expect(settings.timeFormat).toBe("12-hour");
	});

	it("collects localBackgrounds data-URIs as images", () => {
		const uri = "data:image/png;base64,/9j/AAAA";
		const { images } = mapBeautitabSettings({
			...originalFixture,
			localBackgrounds: [uri, 123, uri],
		});
		expect(images).toEqual([uri, uri]);
	});
});

describe("extractLocalBackgrounds", () => {
	/** Build a data-URI from raw bytes (always mislabelled image/png, as BeautiTab does). */
	const dataUri = (bytes: number[]): string => {
		const b64 = btoa(String.fromCharCode(...bytes));
		return `data:image/png;base64,${b64}`;
	};

	it("sniffs real formats from magic bytes despite the png MIME label", async () => {
		const app = new App();
		app.vault.getAbstractFileByPath = vi.fn(() => null);
		const created: string[] = [];
		app.vault.createBinary = vi.fn(async (path: string) => {
			created.push(path);
		});

		const jpeg = dataUri([0xff, 0xd8, 0xff, 0x00]);
		const png = dataUri([0x89, 0x50, 0x4e, 0x47]);
		const webp = dataUri([
			0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
		]);

		const written = await extractLocalBackgrounds(
			app as unknown as import("obsidian").App,
			[jpeg, png, webp],
			"Backgrounds"
		);

		expect(app.vault.createFolder).toHaveBeenCalledWith("Backgrounds");
		expect(written[0].endsWith(".jpg")).toBe(true);
		expect(written[1].endsWith(".png")).toBe(true);
		expect(written[2].endsWith(".webp")).toBe(true);
	});

	it("returns an empty list and writes nothing for no images", async () => {
		const app = new App();
		const written = await extractLocalBackgrounds(
			app as unknown as import("obsidian").App,
			[],
			"Backgrounds"
		);
		expect(written).toEqual([]);
		expect(app.vault.createFolder).not.toHaveBeenCalled();
	});
});

describe("readBeautitabData", () => {
	it("reads and parses data.json at the beautitab plugin path", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => true);
		app.vault.adapter.read = vi.fn(async () => JSON.stringify(forkFixture));

		const data = await readBeautitabData(
			app as unknown as import("obsidian").App
		);
		expect(app.vault.adapter.exists).toHaveBeenCalledWith(
			".obsidian/plugins/beautitab/data.json"
		);
		expect(data?.backgroundTheme).toBe("spring");
	});

	it("returns null when the file is absent", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => false);
		expect(
			await readBeautitabData(app as unknown as import("obsidian").App)
		).toBeNull();
	});

	it("returns null on unparseable JSON", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => true);
		app.vault.adapter.read = vi.fn(async () => "{ not json");
		expect(
			await readBeautitabData(app as unknown as import("obsidian").App)
		).toBeNull();
	});
});

describe("importFromBeautitab", () => {
	const makePlugin = (app: App) => {
		// Minimal settings stand-in: the orchestrator only reads backgroundTheme
		// and unsplashKeySecretId after the merge, and writes the import flag.
		const settings = {
			backgroundTheme: BackgroundTheme.SEASONS_AND_HOLIDAYS,
			unsplashKeySecretId: "",
		} as unknown as NewTabPluginSettings;
		return {
			plugin: {
				app,
				settings,
				saveSettings: vi.fn(async () => {}),
				settingsObservable: { setValue: vi.fn() },
			},
			settings,
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("merges mapped settings, stores the key in SecretStorage, and marks completed", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => true);
		app.vault.adapter.read = vi.fn(async () => JSON.stringify(forkFixture));
		const { plugin, settings } = makePlugin(app);

		const result = await importFromBeautitab(
			plugin as never,
			DEFAULT_IMPORT_IMAGE_FOLDER
		);

		expect(result.imported).toBe(true);
		expect(result.keyImported).toBe(true);
		expect(app.secretStorage.setSecret).toHaveBeenCalledWith(
			IMPORTED_UNSPLASH_SECRET_ID,
			"REDACTED-DUMMY-UNSPLASH-KEY"
		);
		expect(settings.unsplashKeySecretId).toBe(IMPORTED_UNSPLASH_SECRET_ID);
		expect(settings.backgroundTheme).toBe("spring");
		expect(settings.quoteUseOnline).toBe(true);
		expect(settings.beautitabImportCompleted).toBe(true);
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it("does not flag needsUnsplashKey once a key was imported (spring is an Unsplash theme)", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => true);
		app.vault.adapter.read = vi.fn(async () => JSON.stringify(forkFixture));
		const { plugin } = makePlugin(app);

		const result = await importFromBeautitab(plugin as never, "");
		expect(result.needsUnsplashKey).toBe(false);
	});

	it("flags needsUnsplashKey when an Unsplash theme arrives without a key", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => true);
		app.vault.adapter.read = vi.fn(async () =>
			JSON.stringify({ ...originalFixture, backgroundTheme: "summer" })
		);
		const { plugin } = makePlugin(app);

		const result = await importFromBeautitab(plugin as never, "");
		expect(result.keyImported).toBe(false);
		expect(result.needsUnsplashKey).toBe(true);
	});

	it("reports not-imported when there is no BeautiTab data", async () => {
		const app = new App();
		app.vault.adapter.exists = vi.fn(async () => false);
		const { plugin } = makePlugin(app);

		const result = await importFromBeautitab(plugin as never, "");
		expect(result.imported).toBe(false);
		expect(plugin.saveSettings).not.toHaveBeenCalled();
	});
});

describe("isBeautitabEnabled", () => {
	it("is false when BeautiTab is not loaded (disabled or not installed)", () => {
		const app = new App();
		expect(
			isBeautitabEnabled(app as unknown as import("obsidian").App)
		).toBe(false);
	});

	it("is true when BeautiTab is enabled (present in app.plugins.plugins)", () => {
		const app = new App();
		app.plugins.plugins[BEAUTITAB_PLUGIN_ID] = {};
		expect(
			isBeautitabEnabled(app as unknown as import("obsidian").App)
		).toBe(true);
	});
});
