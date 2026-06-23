import { describe, expect, it } from "vitest";
import {
	resolveStyleVars,
	resolveAllStyleVars,
	textStyleToVars,
} from "../React/Utils/resolveTextStyles";
import {
	DEFAULT_TEXT_STYLE,
	DEFAULT_TEXT_STYLE_ID,
	defaultStyleAssignments,
} from "../src/Settings/textStyles";
import { FONT_WEIGHT, STYLE_TARGET } from "../src/Types/Enums";
import type { TextStyle } from "../src/Types/Interfaces";

const vars = (style: TextStyle): Record<string, string> =>
	textStyleToVars(style) as Record<string, string>;

describe("textStyleToVars", () => {
	it("emits only a neutral scale for the Default style (no overrides)", () => {
		expect(vars(DEFAULT_TEXT_STYLE)).toEqual({ "--nt-size-scale": "1" });
	});

	it("emits every property for a fully-customised style", () => {
		expect(
			vars({
				id: "x",
				name: "X",
				fontFamily: "Inter",
				sizePercent: 150,
				weight: FONT_WEIGHT.BOLD,
				italic: true,
				color: "#ffffff",
			})
		).toEqual({
			"--nt-font-family": "Inter",
			"--nt-size-scale": "1.5",
			"--nt-font-weight": "700",
			"--nt-font-style": "italic",
			"--nt-color": "#ffffff",
		});
	});

	it("quotes a multi-word font family", () => {
		expect(vars({ ...DEFAULT_TEXT_STYLE, fontFamily: "Times New Roman" })[
			"--nt-font-family"
		]).toBe('"Times New Roman"');
	});

	it("treats a non-positive or non-finite size as no change", () => {
		expect(vars({ ...DEFAULT_TEXT_STYLE, sizePercent: 0 })["--nt-size-scale"]).toBe(
			"1"
		);
		expect(
			vars({ ...DEFAULT_TEXT_STYLE, sizePercent: Number.NaN })[
				"--nt-size-scale"
			]
		).toBe("1");
	});

	it("omits a blank color", () => {
		expect(vars({ ...DEFAULT_TEXT_STYLE, color: "   " })).not.toHaveProperty(
			"--nt-color"
		);
	});
});

describe("resolveStyleVars", () => {
	const custom: TextStyle = {
		id: "style-1",
		name: "Loud",
		fontFamily: "Inter",
		sizePercent: 200,
		weight: FONT_WEIGHT.BOLD,
		italic: false,
		color: "#abcdef",
	};
	const styles = [DEFAULT_TEXT_STYLE, custom];

	it("resolves the assigned style", () => {
		const assignments = defaultStyleAssignments();
		assignments[STYLE_TARGET.TIME] = "style-1";
		expect(
			(resolveStyleVars(styles, assignments, STYLE_TARGET.TIME) as Record<
				string,
				string
			>)["--nt-size-scale"]
		).toBe("2");
	});

	it("falls back to Default when the assigned id is missing", () => {
		const assignments = defaultStyleAssignments();
		assignments[STYLE_TARGET.QUOTE] = "deleted-style";
		expect(
			resolveStyleVars(styles, assignments, STYLE_TARGET.QUOTE)
		).toEqual({ "--nt-size-scale": "1" });
	});

	it("falls back to Default when the target has no assignment at all", () => {
		const assignments = {} as Record<STYLE_TARGET, string>;
		expect(
			resolveStyleVars(styles, assignments, STYLE_TARGET.GREETING)
		).toEqual({ "--nt-size-scale": "1" });
	});
});

describe("resolveAllStyleVars", () => {
	it("returns an entry for every text target", () => {
		const result = resolveAllStyleVars(
			[DEFAULT_TEXT_STYLE],
			defaultStyleAssignments()
		);
		expect(Object.keys(result).sort()).toEqual(
			Object.values(STYLE_TARGET).sort()
		);
	});

	it("leaves the Default id pointing at a neutral style", () => {
		const result = resolveAllStyleVars(
			[DEFAULT_TEXT_STYLE],
			defaultStyleAssignments()
		);
		expect(result[STYLE_TARGET.TIME]).toEqual({ "--nt-size-scale": "1" });
		expect(DEFAULT_TEXT_STYLE_ID).toBe("default");
	});
});
