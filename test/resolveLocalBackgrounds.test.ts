import { describe, expect, it, vi } from "vitest";
import { App, createMockTFile } from "./__mocks__/obsidian";
import { resolveLocalBackgroundUrls } from "../React/Utils/resolveLocalBackgrounds";

// The util is typed against obsidian's real App; the mock is structurally
// narrower, so funnel it through this alias to keep the call sites clean.
type ResolverApp = Parameters<typeof resolveLocalBackgroundUrls>[0];

/** Wire a mock App whose vault contains the given files (for folder scanning). */
const makeApp = (
	files: { path: string; extension: string }[]
): ResolverApp => {
	const tfiles = files.map((f) =>
		createMockTFile({ path: f.path, extension: f.extension })
	);
	const app = new App();
	app.vault.getFiles = vi.fn(() => tfiles);
	return app as unknown as ResolverApp;
};

describe("resolveLocalBackgroundUrls", () => {
	it("returns an empty list when there is no app", () => {
		expect(resolveLocalBackgroundUrls(null, "Backgrounds")).toEqual([]);
		expect(resolveLocalBackgroundUrls(undefined, "Backgrounds")).toEqual([]);
	});

	it("returns an empty list when no folder is configured", () => {
		const app = makeApp([{ path: "Backgrounds/a.png", extension: "png" }]);
		expect(resolveLocalBackgroundUrls(app, "")).toEqual([]);
	});

	it("resolves every image under the folder, recursively", () => {
		const app = makeApp([
			{ path: "Backgrounds/one.png", extension: "png" },
			{ path: "Backgrounds/nested/two.webp", extension: "webp" },
			{ path: "Backgrounds/notes.md", extension: "md" },
			{ path: "Other/three.png", extension: "png" },
		]);
		const urls = resolveLocalBackgroundUrls(app, "Backgrounds");
		expect(urls).toContain("app://vault/Backgrounds/one.png");
		expect(urls).toContain("app://vault/Backgrounds/nested/two.webp");
		// Non-images and files outside the folder are excluded.
		expect(urls).not.toContain("app://vault/Backgrounds/notes.md");
		expect(urls).not.toContain("app://vault/Other/three.png");
	});

	it("does not treat a same-prefixed sibling folder as inside", () => {
		const app = makeApp([
			{ path: "Backgrounds/in.png", extension: "png" },
			{ path: "Backgrounds-old/out.png", extension: "png" },
		]);
		const urls = resolveLocalBackgroundUrls(app, "Backgrounds");
		expect(urls).toEqual(["app://vault/Backgrounds/in.png"]);
	});

	it("matches image extensions case-insensitively", () => {
		const app = makeApp([
			{ path: "Backgrounds/PHOTO.PNG", extension: "PNG" },
		]);
		expect(resolveLocalBackgroundUrls(app, "Backgrounds")).toEqual([
			"app://vault/Backgrounds/PHOTO.PNG",
		]);
	});
});
