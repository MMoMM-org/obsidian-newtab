import { globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mts", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	// NOTE: this repo is a fork of obsidian-beautitab, whose source predates and
	// was not written against the strict `recommendedTypeChecked` rule set the
	// MiYo blueprint normally uses. We run the (still type-aware) `recommended`
	// set here so lint stays useful and green; tighten toward
	// `recommendedTypeChecked` incrementally as the fork is refactored.
	...tseslint.configs.recommended,
	...obsidianmd.configs.recommended,
	// ── Enforced standards ──────────────────────────────────────────────────
	// The inherited beautitab debt (untyped Obsidian internals, `any` Observable,
	// deprecated display(), enum comparisons, unawaited promises) has been paid
	// down, so these rules are now errors — regressions fail CI. sentence-case is
	// scoped (not disabled) so proper nouns/acronyms don't false-positive. New
	// code is expected to keep this green.
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/no-deprecated": "error",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-member-access": "error",
			"@typescript-eslint/no-unsafe-argument": "error",
			"@typescript-eslint/no-unsafe-call": "error",
			"@typescript-eslint/no-unsafe-return": "error",
			"@typescript-eslint/no-unsafe-function-type": "error",
			"@typescript-eslint/no-unsafe-enum-comparison": "error",
			"@typescript-eslint/no-duplicate-enum-values": "error",
			"@typescript-eslint/restrict-template-expressions": "error",
			"no-case-declarations": "error",
			"import/no-nodejs-modules": "error",
			// Scope the rule (don't disable it): preserve product/proper-noun
			// casing it would otherwise lowercase, and skip URL/tag-path literals.
			// Acronyms (URL, OAuth, …) keep the plugin's defaults.
			"obsidianmd/ui/sentence-case": [
				"error",
				{
					brands: ["Obsidian", "NewTab", "Unsplash", "ZenQuotes"],
					ignoreRegex: [
						"\\w+\\.(?:com|net|org|io)\\b",
						"^[a-z][\\w-]*(?:/[\\w-]+)+$",
					],
				},
			],
			"obsidianmd/rule-custom-message": "error",
			"obsidianmd/prefer-window-timers": "error",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"build",
		"esbuild.config.mjs",
		"version-bump.mjs",
		"versions.json",
		"vitest.config.ts",
		"vitest.live.config.ts",
		"main.js",
		"test/__mocks__/**",
		"test/**/*.test.ts",
		"test/**/helpers.ts",
		"test/fixtures/**",
		"test/*/.obsidian/**",
		"claude-docker-home/**",
	]),
);
