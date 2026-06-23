import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getCachedSystemFonts,
	loadSystemFonts,
	resetSystemFontsCache,
	systemFontsAvailable,
} from "../React/Utils/systemFonts";

// jsdom has no `activeWindow`, so the util falls back to the global `window`;
// these tests drive it by attaching/removing a fake `queryLocalFonts`.
type FontWindow = Window & {
	queryLocalFonts?: () => Promise<Array<{ family: string }>>;
};

const fontWindow = window as FontWindow;

afterEach(() => {
	delete fontWindow.queryLocalFonts;
	resetSystemFontsCache();
});

describe("systemFonts", () => {
	it("reports unavailable and returns nothing when the API is absent", async () => {
		expect(systemFontsAvailable()).toBe(false);
		expect(await loadSystemFonts()).toEqual([]);
		expect(getCachedSystemFonts()).toEqual([]);
	});

	it("returns de-duplicated, sorted families when the API is present", async () => {
		fontWindow.queryLocalFonts = vi.fn(async () => [
			{ family: "Inter" },
			{ family: "Arial" },
			{ family: "Inter" },
		]);

		expect(systemFontsAvailable()).toBe(true);
		expect(await loadSystemFonts()).toEqual(["Arial", "Inter"]);
	});

	it("caches the result so the API is queried only once", async () => {
		const query = vi.fn(async () => [{ family: "Inter" }]);
		fontWindow.queryLocalFonts = query;

		await loadSystemFonts();
		await loadSystemFonts();

		expect(query).toHaveBeenCalledTimes(1);
		expect(getCachedSystemFonts()).toEqual(["Inter"]);
	});

	it("swallows a permission rejection and reports nothing", async () => {
		fontWindow.queryLocalFonts = vi.fn(() =>
			Promise.reject(new Error("denied"))
		);

		expect(await loadSystemFonts()).toEqual([]);
		expect(getCachedSystemFonts()).toEqual([]);
	});
});
