import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import getTime from "../React/Utils/getTime";
import { TIME_FORMAT } from "../src/Types/Enums";

/** Pin the wall clock to a fixed local time for deterministic formatting. */
const atTime = (hours: number, minutes: number) => {
	const d = new Date(2024, 0, 1, hours, minutes, 0, 0);
	vi.setSystemTime(d);
};

describe("getTime", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	describe("24-hour format", () => {
		it.each([
			[0, 0, "00:00"],
			[9, 5, "09:05"],
			[13, 30, "13:30"],
			[23, 59, "23:59"],
			[12, 0, "12:00"],
		])("formats %i:%i as %s", (h, m, expected) => {
			atTime(h, m);
			expect(getTime(TIME_FORMAT.TWENTY_FOUR_HOUR)).toBe(expected);
		});
	});

	describe("12-hour format", () => {
		it.each([
			[0, 0, "12:00"], // midnight -> 12
			[9, 5, "9:05"],
			[12, 0, "12:00"], // noon stays 12
			[13, 30, "1:30"],
			[23, 59, "11:59"],
		])("formats %i:%i as %s", (h, m, expected) => {
			atTime(h, m);
			expect(getTime(TIME_FORMAT.TWELVE_HOUR)).toBe(expected);
		});
	});
});
