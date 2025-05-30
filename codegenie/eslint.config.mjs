// ESLint configuration to catch TypeScript issues and enforce consistent coding style

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.ts"], // Target all TypeScript files
    },
    {
        plugins: {
            "@typescript-eslint": typescriptEslint, // Enable TypeScript-specific linting rules
        },

        languageOptions: {
            parser: tsParser,         // Use the TypeScript parser to analyze code
            ecmaVersion: 2022,        // Support modern ECMAScript features (up to 2022)
            sourceType: "module",     // Treat files as ES modules (enables import/export)
        },

        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"], // Enforce consistent import naming
            }],
            curly: "warn",                // Require braces around blocks in control statements
            eqeqeq: "warn",              // Enforce strict equality (=== and !==)
            "no-throw-literal": "warn",  // Disallow throwing literals (like strings or numbers)
            semi: "warn",                // Require semicolons at the end of statements
        },
    },
];
