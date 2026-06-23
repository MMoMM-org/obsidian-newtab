import { describe, expect, it } from "vitest";
import { cssFontFamily } from "../src/Utils/cssFontFamily";

describe("cssFontFamily", () => {
	it("returns an empty string for blank input (so callers can inherit)", () => {
		expect(cssFontFamily("")).toBe("");
		expect(cssFontFamily("   ")).toBe("");
	});

	it("leaves a single-word family untouched", () => {
		expect(cssFontFamily("Inter")).toBe("Inter");
	});

	it("quotes a multi-word family", () => {
		expect(cssFontFamily("Times New Roman")).toBe('"Times New Roman"');
	});

	it("trims surrounding whitespace before quoting", () => {
		expect(cssFontFamily("  Comic Sans MS  ")).toBe('"Comic Sans MS"');
	});

	it("leaves an existing stack (comma) untouched", () => {
		expect(cssFontFamily("Inter, sans-serif")).toBe("Inter, sans-serif");
	});

	it("leaves an already-quoted family untouched", () => {
		expect(cssFontFamily('"My Font"')).toBe('"My Font"');
		expect(cssFontFamily("'My Font'")).toBe("'My Font'");
	});
});
