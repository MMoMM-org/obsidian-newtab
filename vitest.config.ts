import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		// Mirror tsconfig's baseUrl="." so production code's bare `src/…`
		// imports resolve under vitest, and stub `obsidian` with the mock.
		alias: [
			{
				find: "obsidian",
				replacement: path.resolve(
					__dirname,
					"test/__mocks__/obsidian.ts"
				),
			},
			{
				find: /^src\//,
				replacement: path.resolve(__dirname, "src") + "/",
			},
		],
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["test/**/*.test.ts"],
		exclude: ["test/live/**"],
		coverage: {
			provider: "v8",
			// vitest 4 reports every file matched by `include` (the old `all: true`
			// behaviour is now the default), so untested files surface as 0%. A few
			// large uncovered TS files the v8 AST walker can't parse are reported as
			// "excluded" rather than failing the run — that's expected, not an error.
			include: ["src/**/*.ts", "React/**/*.ts", "main.ts"],
			exclude: ["**/*.d.ts"],
		},
	},
});
