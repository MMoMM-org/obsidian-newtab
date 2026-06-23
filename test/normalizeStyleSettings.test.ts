import { describe, expect, it } from "vitest";
import {
	DEFAULT_TEXT_STYLE,
	DEFAULT_TEXT_STYLE_ID,
	normalizeStyleSettings,
} from "../src/Settings/textStyles";
import { FONT_WEIGHT, STYLE_TARGET } from "../src/Types/Enums";
import type { NewTabPluginSettings } from "../src/Settings/Settings";
import type { TextStyle } from "../src/Types/Interfaces";

/** A minimal settings object carrying only the style fields under test. */
const makeSettings = (
	partial: Partial<
		Pick<NewTabPluginSettings, "textStyles" | "styleAssignments">
	>
): NewTabPluginSettings =>
	({
		textStyles: partial.textStyles as TextStyle[],
		styleAssignments: partial.styleAssignments as Record<
			STYLE_TARGET,
			string
		>,
	}) as NewTabPluginSettings;

describe("normalizeStyleSettings", () => {
	it("fills in a Default style and assignments for an empty (old) install", () => {
		const settings = makeSettings({});
		normalizeStyleSettings(settings);

		expect(settings.textStyles).toHaveLength(1);
		expect(settings.textStyles[0].id).toBe(DEFAULT_TEXT_STYLE_ID);
		for (const target of Object.values(STYLE_TARGET)) {
			expect(settings.styleAssignments[target]).toBe(DEFAULT_TEXT_STYLE_ID);
		}
	});

	it("prepends a Default style when one is missing", () => {
		const custom: TextStyle = {
			id: "style-1",
			name: "Custom",
			fontFamily: "Inter",
			sizePercent: 120,
			weight: FONT_WEIGHT.BOLD,
			italic: false,
			color: "",
		};
		const settings = makeSettings({
			textStyles: [custom],
			styleAssignments: defaultAssign(),
		});
		normalizeStyleSettings(settings);

		expect(settings.textStyles[0].id).toBe(DEFAULT_TEXT_STYLE_ID);
		expect(settings.textStyles).toHaveLength(2);
	});

	it("keeps a valid assignment and resets a dangling one", () => {
		const custom: TextStyle = { ...DEFAULT_TEXT_STYLE, id: "style-1", name: "C" };
		const assignments = defaultAssign();
		assignments[STYLE_TARGET.TIME] = "style-1"; // valid
		assignments[STYLE_TARGET.QUOTE] = "ghost"; // missing
		const settings = makeSettings({
			textStyles: [DEFAULT_TEXT_STYLE, custom],
			styleAssignments: assignments,
		});
		normalizeStyleSettings(settings);

		expect(settings.styleAssignments[STYLE_TARGET.TIME]).toBe("style-1");
		expect(settings.styleAssignments[STYLE_TARGET.QUOTE]).toBe(
			DEFAULT_TEXT_STYLE_ID
		);
	});

	it("clones styles so the shared Default constant is never mutated", () => {
		const settings = makeSettings({});
		normalizeStyleSettings(settings);
		settings.textStyles[0].fontFamily = "Mutated";
		expect(DEFAULT_TEXT_STYLE.fontFamily).toBe("");
	});
});

/** Assignments with every target pointing at Default. */
function defaultAssign(): Record<STYLE_TARGET, string> {
	const out = {} as Record<STYLE_TARGET, string>;
	for (const target of Object.values(STYLE_TARGET)) {
		out[target] = DEFAULT_TEXT_STYLE_ID;
	}
	return out;
}
