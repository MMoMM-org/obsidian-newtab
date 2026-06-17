import { describe, it, expect } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { getLeafHistory } from "../src/Types/ObsidianInternals";

/**
 * `getLeafHistory` reads the leaf's internal back/forward navigation stacks.
 * The API isn't in obsidian.d.ts, so the helper must degrade gracefully when
 * it's absent rather than throwing.
 */
describe("getLeafHistory", () => {
	// Tests construct plain objects shaped like the bits of WorkspaceLeaf the
	// helper actually reads, then cast to the full type.
	const makeLeaf = (history: unknown): WorkspaceLeaf =>
		({ history }) as unknown as WorkspaceLeaf;

	it("returns the history object when present", () => {
		const history = {
			back: () => {},
			forward: () => {},
			backHistory: [{}, {}],
			forwardHistory: [{}],
		};
		const result = getLeafHistory(makeLeaf(history));
		expect(result).toBe(history);
		expect(result?.backHistory.length).toBe(2);
		expect(result?.forwardHistory.length).toBe(1);
	});

	it("returns null when the leaf has no history object", () => {
		expect(getLeafHistory(makeLeaf(undefined))).toBeNull();
	});

	it("returns null when history lacks a back() method", () => {
		expect(getLeafHistory(makeLeaf({ backHistory: [] }))).toBeNull();
	});

	it("returns null for a null or undefined leaf", () => {
		expect(getLeafHistory(null)).toBeNull();
		expect(getLeafHistory(undefined)).toBeNull();
	});
});
