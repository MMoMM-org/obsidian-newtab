import { describe, expect, it } from "vitest";
import getEasterDate from "../React/Utils/getEasterDate";

/** Format as YYYY-MM-DD in local time for stable comparison. */
const ymd = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
		d.getDate(),
	).padStart(2, "0")}`;

describe("getEasterDate", () => {
	// Known Western (Gregorian) Easter Sundays.
	it.each([
		[2020, "2020-04-12"],
		[2021, "2021-04-04"],
		[2022, "2022-04-17"],
		[2023, "2023-04-09"],
		[2024, "2024-03-31"],
		[2025, "2025-04-20"],
		[2026, "2026-04-05"],
	])("returns the correct Easter Sunday for %i", (year, expected) => {
		expect(ymd(getEasterDate(year))).toBe(expected);
	});

	it("always lands on a Sunday", () => {
		for (let year = 2000; year <= 2030; year++) {
			expect(getEasterDate(year).getDay()).toBe(0);
		}
	});

	it("falls between 22 March and 25 April", () => {
		for (let year = 2000; year <= 2030; year++) {
			const d = getEasterDate(year);
			const month = d.getMonth(); // 2 = March, 3 = April
			const day = d.getDate();
			const afterMarch21 = month === 2 ? day >= 22 : true;
			const beforeApril26 = month === 3 ? day <= 25 : true;
			expect(month === 2 || month === 3).toBe(true);
			expect(afterMarch21 && beforeApril26).toBe(true);
		}
	});
});
