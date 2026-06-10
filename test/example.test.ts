import { describe, expect, it } from "vitest";
import capitalizeFirstLetter from "../src/Utils/capitalizeFirstLetter";
import {
	isWithinDaysBefore,
	isWithinDaysAfter,
} from "../React/Utils/isWithinXDays";

describe("capitalizeFirstLetter", () => {
	it("capitalizes the first character", () => {
		expect(capitalizeFirstLetter("hello")).toBe("Hello");
	});

	it("leaves an already-capitalized string unchanged", () => {
		expect(capitalizeFirstLetter("World")).toBe("World");
	});
});

describe("isWithinXDays", () => {
	const base = new Date("2026-06-10T00:00:00Z");

	it("detects a date within N days before", () => {
		const earlier = new Date("2026-06-07T00:00:00Z");
		expect(isWithinDaysBefore(earlier, 5, base)).toBe(true);
		expect(isWithinDaysBefore(new Date("2026-06-01T00:00:00Z"), 5, base)).toBe(
			false,
		);
	});

	it("detects a date within N days after", () => {
		const later = new Date("2026-06-13T00:00:00Z");
		expect(isWithinDaysAfter(later, 5, base)).toBe(true);
		expect(isWithinDaysAfter(new Date("2026-06-20T00:00:00Z"), 5, base)).toBe(
			false,
		);
	});
});
