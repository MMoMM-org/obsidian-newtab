import { afterEach, describe, expect, it, vi } from "vitest";
import { getLanguage } from "./__mocks__/obsidian";
import { t } from "../React/Utils/i18n";

describe("i18n t()", () => {
	afterEach(() => {
		vi.mocked(getLanguage).mockReturnValue("en");
	});

	it("returns English by default", () => {
		vi.mocked(getLanguage).mockReturnValue("en");
		expect(t("background.heading")).toBe("Background settings");
	});

	it("returns the localized string for a known language", () => {
		vi.mocked(getLanguage).mockReturnValue("de");
		expect(t("background.heading")).toBe("Hintergrund");
	});

	it("resolves a region variant (de-DE) to its base language", () => {
		vi.mocked(getLanguage).mockReturnValue("de-DE");
		expect(t("quote.edit")).toBe("Bearbeiten");
	});

	it("falls back to English for an unknown language", () => {
		vi.mocked(getLanguage).mockReturnValue("xx");
		expect(t("quote.edit")).toBe("Edit");
	});

	it("falls back to English when getLanguage returns empty", () => {
		vi.mocked(getLanguage).mockReturnValue("");
		expect(t("debug.logging")).toBe("Debug logging");
	});
});
