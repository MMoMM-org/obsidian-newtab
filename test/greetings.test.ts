import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLanguage } from "obsidian";
import getTimeOfDayGreeting from "../React/Utils/getTimeOfDayGreeting";
import {
	GREETINGS,
	GREETING_LANGUAGE_AUTO,
	resolveGreetingLocale,
} from "../React/Utils/greetings";

const atHour = (hours: number) => {
	vi.setSystemTime(new Date(2024, 0, 1, hours, 0, 0, 0));
};

describe("getTimeOfDayGreeting", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it.each([
		[5, "Good morning"], // start of morning
		[11, "Good morning"], // end of morning
		[12, "Good afternoon"], // start of afternoon
		[17, "Good afternoon"], // end of afternoon
		[18, "Good evening"], // start of evening
		[23, "Good evening"],
		[4, "Good evening"], // before 5am is still evening bucket
		[0, "Good evening"], // midnight
	])("at %i:00 greets with %s (en)", (hour, expected) => {
		atHour(hour);
		expect(getTimeOfDayGreeting("en")).toBe(expected);
	});

	it("uses the requested locale", () => {
		atHour(9);
		expect(getTimeOfDayGreeting("de")).toBe("Guten Morgen");
	});

	it("falls back to English for an unsupported locale", () => {
		atHour(9);
		expect(getTimeOfDayGreeting("xx")).toBe(GREETINGS.en.morning);
	});
});

describe("resolveGreetingLocale", () => {
	beforeEach(() => {
		vi.mocked(getLanguage).mockReturnValue("en");
	});
	afterEach(() => {
		vi.mocked(getLanguage).mockReset();
	});

	it("returns an explicitly chosen supported locale", () => {
		expect(resolveGreetingLocale("de")).toBe("de");
	});

	it("follows Obsidian's display language when set to auto", () => {
		vi.mocked(getLanguage).mockReturnValue("fr");
		expect(resolveGreetingLocale(GREETING_LANGUAGE_AUTO)).toBe("fr");
	});

	it("falls back from a region variant to its base code", () => {
		expect(resolveGreetingLocale("pt-BR")).toBe("pt");
	});

	it("falls back to English for an unsupported locale", () => {
		expect(resolveGreetingLocale("xx")).toBe("en");
	});

	it("falls back to English when auto and the display language is unsupported", () => {
		vi.mocked(getLanguage).mockReturnValue("xx");
		expect(resolveGreetingLocale(GREETING_LANGUAGE_AUTO)).toBe("en");
	});

	it("falls back to English when getLanguage returns empty", () => {
		vi.mocked(getLanguage).mockReturnValue("");
		expect(resolveGreetingLocale(GREETING_LANGUAGE_AUTO)).toBe("en");
	});
});
