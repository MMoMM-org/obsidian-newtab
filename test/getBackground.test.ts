import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestUrl } from "obsidian";
import getBackground, {
	getSeasonalTag,
	hourStamp,
} from "../React/Utils/getBackground";
import { BackgroundTheme } from "../src/Types/Enums";

const mockUnsplash = (
	value: { status?: number; url?: string; throws?: boolean } = {},
) => {
	if (value.throws) {
		vi.mocked(requestUrl).mockRejectedValue(new Error("offline"));
		return;
	}
	const status = value.status ?? 200;
	vi.mocked(requestUrl).mockResolvedValue({
		status,
		json:
			status === 200 && value.url !== null
				? { urls: { regular: value.url ?? "https://img/x.jpg" } }
				: {},
		text: "",
		headers: {},
	} as Awaited<ReturnType<typeof requestUrl>>);
};

/** Pull the `query=` value out of the endpoint passed to the last requestUrl call. */
const lastQuery = (): string => {
	const arg = vi.mocked(requestUrl).mock.calls.at(-1)?.[0] as { url: string };
	return decodeURIComponent(new URL(arg.url).searchParams.get("query") ?? "");
};

describe("getSeasonalTag", () => {
	const at = (month: number, day: number, year = 2024) =>
		getSeasonalTag(new Date(year, month - 1, day, 12, 0));

	it.each([
		["New Year", 1, 1, "fireworks"],
		["mid-January", 1, 15, "winter"],
		["Groundhog Day", 2, 2, "groundhog"],
		["Valentine's Day", 2, 14, "valentine"],
		["Women's Day", 3, 8, "womensday"],
		["Pi Day", 3, 14, "pie"],
		["St Patrick's", 3, 17, "pub"],
		["April Fools", 4, 1, "laughing"],
		["Earth Day", 4, 22, "earth"],
		["mid-April", 4, 10, "spring"],
		["May the 4th", 5, 4, "yoda"],
		["Cinco de Mayo", 5, 5, "mexico"],
		["Flag Day", 6, 14, "america,flag"],
		["Juneteenth", 6, 19, "juneteenth"],
		["Indigenous Peoples", 6, 21, "firstnations"],
		["Canada Day", 7, 1, "fireworks"],
		["July 4th", 7, 4, "fireworks"],
		["August", 8, 15, "summer"],
		["September", 9, 10, "summer"],
		["Halloween", 10, 31, "helloween"],
		["mid-October", 10, 15, "fall"],
		["Remembrance Day", 11, 11, "veteran"],
		["Christmas", 12, 25, "christmas"],
		["New Year's Eve", 12, 31, "fireworks"],
	])("maps %s to %s", (_label, month, day, expected) => {
		expect(at(month, day)).toBe(expected);
	});

	it("returns the easter tag within 5 days before Easter Sunday", () => {
		// Easter 2024 = March 31. March 28 is 3 days before.
		expect(at(3, 28)).toBe("easter");
	});

	it("does not apply the easter tag well before the window", () => {
		// March 20 is 11 days before Easter — falls through to the March default.
		expect(at(3, 20)).toBe("winter");
	});
});

describe("getBackground", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.mocked(requestUrl).mockReset();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the custom URL verbatim for the CUSTOM theme", async () => {
		const url = await getBackground(
			BackgroundTheme.CUSTOM,
			"https://example.com/bg.jpg",
			"",
			[],
			null,
		);
		expect(url).toBe("https://example.com/bg.jpg");
		expect(requestUrl).not.toHaveBeenCalled();
	});

	it.each([
		BackgroundTheme.TRANSPARENT,
		BackgroundTheme.TRANSPARENT_WITH_SHADOWS,
	])("returns null for %s", async (theme) => {
		expect(await getBackground(theme, "", "", [], "key")).toBeNull();
		expect(requestUrl).not.toHaveBeenCalled();
	});

	describe("LOCAL theme", () => {
		it("returns one of the local backgrounds", async () => {
			vi.spyOn(Math, "random").mockReturnValue(0);
			const url = await getBackground(
				BackgroundTheme.LOCAL,
				"",
				"",
				["app://a.png", "app://b.png"],
				null,
			);
			expect(url).toBe("app://a.png");
		});

		it("returns null when there are no local backgrounds", async () => {
			expect(
				await getBackground(BackgroundTheme.LOCAL, "", "", [], null),
			).toBeNull();
		});
	});

	describe("CUSTOM_TOPIC theme", () => {
		it("fetches Unsplash for the trimmed topic", async () => {
			mockUnsplash({ url: "https://img/cats.jpg" });
			const url = await getBackground(
				BackgroundTheme.CUSTOM_TOPIC,
				"",
				"  cats  ",
				[],
				"key",
			);
			expect(url).toBe("https://img/cats.jpg");
			expect(lastQuery()).toBe("cats");
		});

		it("returns null when the topic is blank", async () => {
			expect(
				await getBackground(BackgroundTheme.CUSTOM_TOPIC, "", "   ", [], "key"),
			).toBeNull();
			expect(requestUrl).not.toHaveBeenCalled();
		});
	});

	describe("Unsplash-backed themes", () => {
		it("uses the seasonal tag for SEASONS_AND_HOLIDAYS", async () => {
			mockUnsplash({ url: "https://img/seasonal.jpg" });
			const url = await getBackground(
				BackgroundTheme.SEASONS_AND_HOLIDAYS,
				"",
				"",
				[],
				"key",
			);
			expect(url).toBe("https://img/seasonal.jpg");
			// The query is whatever today's seasonal tag is — just assert one was sent.
			expect(lastQuery().length).toBeGreaterThan(0);
		});

		it("uses the theme name as the query for a plain theme", async () => {
			mockUnsplash({ url: "https://img/mtn.jpg" });
			await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], "key");
			expect(lastQuery()).toBe("mountains");
		});

		it("returns null and skips the request when there is no access key", async () => {
			expect(
				await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], null),
			).toBeNull();
			expect(requestUrl).not.toHaveBeenCalled();
		});

		it("trims the access key before deciding it is missing", async () => {
			expect(
				await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], "   "),
			).toBeNull();
			expect(requestUrl).not.toHaveBeenCalled();
		});

		it("returns null on a non-200 response", async () => {
			mockUnsplash({ status: 403 });
			expect(
				await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], "key"),
			).toBeNull();
		});

		it("returns null when the body has no image url", async () => {
			vi.mocked(requestUrl).mockResolvedValue({
				status: 200,
				json: {},
				text: "",
				headers: {},
			} as Awaited<ReturnType<typeof requestUrl>>);
			expect(
				await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], "key"),
			).toBeNull();
		});

		it("returns null when the request throws", async () => {
			mockUnsplash({ throws: true });
			expect(
				await getBackground(BackgroundTheme.MOUNTAIN, "", "", [], "key"),
			).toBeNull();
		});

		it("caches within the hour: a second call makes no new request", async () => {
			mockUnsplash({ url: "https://img/cached.jpg" });
			const first = await getBackground(
				BackgroundTheme.MOUNTAIN,
				"",
				"",
				[],
				"key",
			);
			const second = await getBackground(
				BackgroundTheme.MOUNTAIN,
				"",
				"",
				[],
				"key",
			);
			expect(first).toBe("https://img/cached.jpg");
			expect(second).toBe("https://img/cached.jpg");
			expect(requestUrl).toHaveBeenCalledTimes(1);
		});
	});
});

describe("hourStamp", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("returns the current UTC hour as YYYY-MM-DDTHH", () => {
		vi.setSystemTime(new Date("2024-01-15T08:30:00Z"));
		expect(hourStamp()).toBe("2024-01-15T08");
	});

	it("changes when the hour rolls over", () => {
		vi.setSystemTime(new Date("2024-01-15T08:59:59Z"));
		const before = hourStamp();
		vi.setSystemTime(new Date("2024-01-15T09:00:00Z"));
		expect(hourStamp()).not.toBe(before);
	});
});
