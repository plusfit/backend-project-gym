import { loadEnv } from "vite";
import { InlineConfig } from "vitest";

export const createVitestTestConfig = (testingType: string): InlineConfig => {
	return {
		root: "./",
		globals: true,
		// Each file gets its own module registry. With a shared one, a file that
		// loads a module before another file's `vi.mock` for one of its imports
		// leaves that module bound to the wrong instance, and the result depends
		// on which file the runner happens to start first. That is what made
		// test-send.test.ts pass locally and fail in CI. Measured cost: ~0.1s
		// on the full suite.
		isolate: true,
		passWithNoTests: true,
		include: [`tests/${testingType}/**/*.test.ts`],
		env: loadEnv("test", process.cwd(), ""),
		coverage: {
			provider: "istanbul",
			reporter: ["text", "json", "html"],
			reportsDirectory: `coverage/${testingType}`,
			include: ["src/**/*.ts"],
			exclude: ["src/main.ts"],
		},
	};
};
