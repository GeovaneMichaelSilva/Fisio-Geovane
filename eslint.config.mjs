import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		linterOptions: {
			reportUnusedDisableDirectives: "off"
		}
	},
	{
		rules: {
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-require-imports": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"react/display-name": "off",
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/immutability": "off",
			"react-hooks/incompatible-library": "off",
			"react-hooks/preserve-manual-memoization": "off",
			"react-hooks/purity": "off",
			"react-hooks/refs": "off",
			"react-hooks/rules-of-hooks": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/static-components": "off",
			"react-hooks/use-memo": "off"
		}
	},
	globalIgnores([
		".next/**",
		"out/**",
		"build/**",
		"node_modules/**",
		"public/**",
		"dist/**",
		"coverage/**",
		"logs/**",
		"*.log",
		".vscode/**",
		".env",
		".env.local",
		"package-lock.json",
		"next-env.d.ts",
		"docs/references/**"
	])
]);
