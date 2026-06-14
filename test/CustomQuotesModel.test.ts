import { describe, expect, it, vi } from "vitest";
import { App } from "./__mocks__/obsidian";
import CustomQuotesModel from "../src/CustomQuotesModel/CustomQuotesModel";
import type { CustomQuote } from "../src/Types/Interfaces";
import type NewTabPlugin from "../main";

/** Minimal plugin stub: the modal only reads `app` and `settings.customQuotes`. */
const makePlugin = (customQuotes: CustomQuote[]) =>
	({
		app: new App(),
		settings: { customQuotes },
	}) as unknown as NewTabPlugin;

const buttonByText = (root: HTMLElement, text: string): HTMLButtonElement => {
	const btn = [...root.querySelectorAll("button")].find(
		(b) => b.textContent === text,
	);
	if (!btn) throw new Error(`button "${text}" not found`);
	return btn as HTMLButtonElement;
};

describe("CustomQuotesModel", () => {
	it("renders one row per existing quote", () => {
		const plugin = makePlugin([
			{ text: "First", author: "A" },
			{ text: "Second", author: "B" },
		]);
		const modal = new CustomQuotesModel(plugin, vi.fn());
		modal.open();

		const textareas = modal.contentEl.querySelectorAll("textarea");
		expect(textareas).toHaveLength(2);
		expect(textareas[0].textContent).toBe("First");
		expect(
			(modal.contentEl.querySelectorAll<HTMLInputElement>('input[type="text"]')[1])
				.value,
		).toBe("B");
	});

	it("deep-clones the settings so edits don't mutate the original until saved", () => {
		const original: CustomQuote[] = [{ text: "Orig", author: "A" }];
		const plugin = makePlugin(original);
		const modal = new CustomQuotesModel(plugin, vi.fn());
		modal.open();

		const textarea = modal.contentEl.querySelector("textarea")!;
		textarea.value = "Edited";
		textarea.dispatchEvent(new Event("change"));

		// The plugin's own array is untouched.
		expect(original[0].text).toBe("Orig");
	});

	it("adds an empty row when 'Add new quote' is clicked", () => {
		const plugin = makePlugin([{ text: "Only", author: "A" }]);
		const modal = new CustomQuotesModel(plugin, vi.fn());
		modal.open();

		buttonByText(modal.contentEl, "Add new quote").click();

		expect(modal.contentEl.querySelectorAll("textarea")).toHaveLength(2);
	});

	it("saves the edited quotes and closes", () => {
		const onSave = vi.fn();
		const plugin = makePlugin([{ text: "Orig", author: "A" }]);
		const modal = new CustomQuotesModel(plugin, onSave);
		modal.open();

		const textarea = modal.contentEl.querySelector("textarea")!;
		textarea.value = "Edited";
		textarea.dispatchEvent(new Event("change"));

		buttonByText(modal.contentEl, "Save").click();

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledWith([{ text: "Edited", author: "A" }]);
		expect(modal.close).toHaveBeenCalled();
	});

	it("includes a newly added quote in the saved payload", () => {
		const onSave = vi.fn();
		const plugin = makePlugin([]);
		const modal = new CustomQuotesModel(plugin, onSave);
		modal.open();

		buttonByText(modal.contentEl, "Add new quote").click();
		const textarea = modal.contentEl.querySelector("textarea")!;
		textarea.value = "Brand new";
		textarea.dispatchEvent(new Event("change"));
		buttonByText(modal.contentEl, "Save").click();

		expect(onSave).toHaveBeenCalledWith([{ text: "Brand new", author: "" }]);
	});
});
