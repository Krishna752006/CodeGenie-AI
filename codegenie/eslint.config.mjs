// This file helps check your TypeScript code for mistakes and keeps the style consistent.

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.ts"], // Apply these settings to all .ts files
    },
    {
        plugins: {
            "@typescript-eslint": typescriptEslint, // Add extra TypeScript-specific rules
        },

        languageOptions: {
            parser: tsParser,         // Use this parser so ESLint can understand TypeScript
            ecmaVersion: 2022,        // Let ESLint understand modern JavaScript (2022 features)
            sourceType: "module",     // Tell ESLint we are using import/export
        },

        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            curly: "warn",                // Always use curly braces {} with if/else and loops
            eqeqeq: "warn",              // Use === and !== instead of == and !=
            "no-throw-literal": "warn",  // Don’t throw strings or numbers — always use Error objects
            semi: "warn",                // Make sure to end lines with a semicolon ;
        },
    },
];