import { afterEach, describe, expect, it, vi } from "vitest";
import { requestUrl } from "obsidian";
import getQuote, { QuoteSources } from "../React/Utils/getQuote";

const baseSources = (overrides: Partial<QuoteSources> = {}): QuoteSources => ({
	useOnline: false,
	useMyQuotes: false,
	useVaultNotes: false,
	customQuotes: [],
	vaultQuotes: [],
	...overrides,
});

const mockOnline = (body: unknown, status = 200) => {
	vi.mocked(requestUrl).mockResolvedValue({
		status,
		json: body,
		text: typeof body === "string" ? body : JSON.stringify(body),
	} as Awaited<ReturnType<typeof requestUrl>>);
};

describe("getQuote", () => {
	afterEach(() => vi.mocked(requestUrl).mockReset());

	it("returns an empty quote when no source is enabled", async () => {
		expect(await getQuote(baseSources())).toEqual({ content: "", author: "" });
	});

	describe("online source", () => {
		it("returns a ZenQuotes quote on a successful fetch", async () => {
			mockOnline([{ q: "Stay hungry", a: "Steve Jobs" }]);
			const quote = await getQuote(baseSources({ useOnline: true }));
			expect(quote).toEqual({
				content: "Stay hungry",
				author: "Steve Jobs",
				fromZenQuotes: true,
			});
		});

		it("falls back to empty on a non-200 response", async () => {
			mockOnline([{ q: "x", a: "y" }], 429);
			expect(await getQuote(baseSources({ useOnline: true }))).toEqual({
				content: "",
				author: "",
			});
		});

		it("treats the rate-limit sentinel as a failure", async () => {
			mockOnline([{ q: "Too many requests", a: "zenquotes.io" }]);
			expect(await getQuote(baseSources({ useOnline: true }))).toEqual({
				content: "",
				author: "",
			});
		});

		it("falls back to empty on a malformed body", async () => {
			mockOnline([{ q: "no author" }]);
			expect(await getQuote(baseSources({ useOnline: true }))).toEqual({
				content: "",
				author: "",
			});
		});

		it("falls back to empty when the request throws", async () => {
			vi.mocked(requestUrl).mockRejectedValue(new Error("offline"));
			expect(await getQuote(baseSources({ useOnline: true }))).toEqual({
				content: "",
				author: "",
			});
		});
	});

	describe("custom quotes source", () => {
		it("returns a custom quote", async () => {
			const quote = await getQuote(
				baseSources({
					useMyQuotes: true,
					customQuotes: [{ text: "Be kind", author: "Me" }],
				}),
			);
			expect(quote).toEqual({ content: "Be kind", author: "Me" });
		});

		it("is ignored when the user has no custom quotes", async () => {
			expect(
				await getQuote(baseSources({ useMyQuotes: true, customQuotes: [] })),
			).toEqual({ content: "", author: "" });
		});
	});

	describe("vault notes source", () => {
		it("returns a vault quote", async () => {
			const quote = await getQuote(
				baseSources({
					useVaultNotes: true,
					vaultQuotes: [
						{ content: "From a note", author: "Author", sourcePath: "q.md" },
					],
				}),
			);
			expect(quote).toEqual({
				content: "From a note",
				author: "Author",
				sourcePath: "q.md",
			});
		});

		it("is ignored when there are no vault quotes", async () => {
			expect(
				await getQuote(baseSources({ useVaultNotes: true, vaultQuotes: [] })),
			).toEqual({ content: "", author: "" });
		});
	});

	it("falls through to another source when the first yields nothing", async () => {
		// Online fails; vault notes should still produce a quote regardless of
		// the randomized source order.
		mockOnline([{ q: "x", a: "y" }], 500);
		const quote = await getQuote(
			baseSources({
				useOnline: true,
				useVaultNotes: true,
				vaultQuotes: [{ content: "Fallback", author: "V", sourcePath: "v.md" }],
			}),
		);
		expect(quote).toEqual({
			content: "Fallback",
			author: "V",
			sourcePath: "v.md",
		});
	});
});
