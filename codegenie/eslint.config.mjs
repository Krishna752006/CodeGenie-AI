/**
 * ESLint configuration for TypeScript files.
 * 
 * This setup enforces code quality, consistent style, and best practices
 * across the project. It mainly focuses on basic TypeScript linting
 * and some simple rules like requiring curly braces and semicolons.
 */

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        // Tell ESLint to apply this config to all .ts files
        files: ["**/*.ts"],
    },
    {
        // Add the TypeScript ESLint plugin so we can use its rules
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            parser: tsParser,           // Use the TypeScript parser instead of the default one
            ecmaVersion: 2022,           // Understand the latest JavaScript features
            sourceType: "module",        // Assume we're using import/export syntax
        },

        // Define all the linting rules we care about
        rules: {
            // Enforce naming conventions for imported identifiers
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],

            // Always use curly braces for blocks (even one-liners)
            curly: "warn",

            // Always use === and !== instead of == and !=
            eqeqeq: "warn",

            // Don't allow throwing plain values like strings or numbers
            // Always throw an Error object
            "no-throw-literal": "warn",

            // Require semicolons at the end of statements
            semi: "warn",
        },
    },
];
