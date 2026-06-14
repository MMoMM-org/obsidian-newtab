import { afterEach, describe, expect, it, vi } from "vitest";
import { App, createMockTFile, getAllTags } from "./__mocks__/obsidian";
import { getVaultQuotes } from "../React/Utils/getVaultQuotes";
import { VAULT_QUOTE_SELECTION } from "../src/Types/Enums";

type VaultApp = Parameters<typeof getVaultQuotes>[0];
type Frontmatter = Record<string, unknown>;

/**
 * Wire a mock App whose markdown files carry the given frontmatter (and
 * optionally tags). Keyed by path so getFileCache can look each note up.
 */
const makeApp = (
	notes: { path: string; frontmatter?: Frontmatter; tags?: string[] }[],
): VaultApp => {
	const files = notes.map((n) => createMockTFile({ path: n.path }));
	const byPath = new Map(notes.map((n) => [n.path, n]));
	const app = new App();
	app.vault.getMarkdownFiles = vi.fn(() => files);
	app.metadataCache.getFileCache = vi.fn((file) => {
		const note = byPath.get(file.path);
		return note ? { frontmatter: note.frontmatter ?? {} } : null;
	});
	vi.mocked(getAllTags).mockImplementation((cache) => {
		// Map the cache back to its note via frontmatter identity.
		const note = notes.find((n) => (n.frontmatter ?? {}) === cache.frontmatter);
		return note?.tags ?? [];
	});
	return app as unknown as VaultApp;
};

const pathConfig = (folder: string) => ({
	selectionMode: VAULT_QUOTE_SELECTION.PATH,
	tag: "",
	folder,
	contentProperty: "Quote",
	authorProperty: "Author",
});

describe("getVaultQuotes", () => {
	afterEach(() => vi.mocked(getAllTags).mockReset());

	it("returns an empty list when there is no app", () => {
		expect(getVaultQuotes(undefined, pathConfig(""))).toEqual([]);
	});

	describe("path selection", () => {
		it("reads quotes from notes inside the configured folder", () => {
			const app = makeApp([
				{ path: "Quotes/a.md", frontmatter: { Quote: "Hello", Author: "X" } },
				{ path: "Other/b.md", frontmatter: { Quote: "Skip", Author: "Y" } },
			]);
			const quotes = getVaultQuotes(app, pathConfig("Quotes"));
			expect(quotes).toEqual([
				{ content: "Hello", author: "X", sourcePath: "Quotes/a.md" },
			]);
		});

		it("scans the whole vault when the folder is empty", () => {
			const app = makeApp([
				{ path: "a.md", frontmatter: { Quote: "One", Author: "X" } },
				{ path: "deep/b.md", frontmatter: { Quote: "Two", Author: "Y" } },
			]);
			expect(getVaultQuotes(app, pathConfig("")).map((q) => q.content)).toEqual([
				"One",
				"Two",
			]);
		});

		it("skips notes missing the content property", () => {
			const app = makeApp([
				{ path: "a.md", frontmatter: { Author: "X" } },
				{ path: "b.md", frontmatter: { Quote: "   ", Author: "Y" } },
				{ path: "c.md", frontmatter: { Quote: "Kept", Author: "Z" } },
			]);
			expect(getVaultQuotes(app, pathConfig("")).map((q) => q.content)).toEqual([
				"Kept",
			]);
		});

		it("leaves the author empty when the property is missing", () => {
			const app = makeApp([
				{ path: "a.md", frontmatter: { Quote: "Anon" } },
			]);
			expect(getVaultQuotes(app, pathConfig(""))).toEqual([
				{ content: "Anon", author: "", sourcePath: "a.md" },
			]);
		});

		it("trims surrounding whitespace from content and author", () => {
			const app = makeApp([
				{ path: "a.md", frontmatter: { Quote: "  spaced  ", Author: "  Me  " } },
			]);
			expect(getVaultQuotes(app, pathConfig(""))).toEqual([
				{ content: "spaced", author: "Me", sourcePath: "a.md" },
			]);
		});

		it("does not treat a same-prefixed sibling folder as inside", () => {
			const app = makeApp([
				{ path: "Quotes/in.md", frontmatter: { Quote: "In", Author: "X" } },
				{ path: "Quotes-old/out.md", frontmatter: { Quote: "Out", Author: "Y" } },
			]);
			expect(getVaultQuotes(app, pathConfig("Quotes")).map((q) => q.content)).toEqual([
				"In",
			]);
		});

		it("honours custom content and author property names", () => {
			const app = makeApp([
				{ path: "a.md", frontmatter: { saying: "Custom", by: "Sage" } },
			]);
			const quotes = getVaultQuotes(app, {
				...pathConfig(""),
				contentProperty: "saying",
				authorProperty: "by",
			});
			expect(quotes).toEqual([
				{ content: "Custom", author: "Sage", sourcePath: "a.md" },
			]);
		});
	});

	describe("tag selection", () => {
		const tagConfig = (tag: string) => ({
			selectionMode: VAULT_QUOTE_SELECTION.TAG,
			tag,
			folder: "",
			contentProperty: "Quote",
			authorProperty: "Author",
		});

		it("returns quotes only from notes carrying the tag", () => {
			const app = makeApp([
				{
					path: "a.md",
					frontmatter: { Quote: "Tagged", Author: "X" },
					tags: ["#quote"],
				},
				{
					path: "b.md",
					frontmatter: { Quote: "Untagged", Author: "Y" },
					tags: ["#other"],
				},
			]);
			expect(getVaultQuotes(app, tagConfig("quote")).map((q) => q.content)).toEqual([
				"Tagged",
			]);
		});

		it("normalizes a leading # in the configured tag", () => {
			const app = makeApp([
				{
					path: "a.md",
					frontmatter: { Quote: "Tagged", Author: "X" },
					tags: ["#quote"],
				},
			]);
			expect(getVaultQuotes(app, tagConfig("#quote")).map((q) => q.content)).toEqual([
				"Tagged",
			]);
		});

		it("returns nothing when no tag is configured", () => {
			const app = makeApp([
				{
					path: "a.md",
					frontmatter: { Quote: "Tagged", Author: "X" },
					tags: ["#quote"],
				},
			]);
			expect(getVaultQuotes(app, tagConfig(""))).toEqual([]);
		});
	});
});
