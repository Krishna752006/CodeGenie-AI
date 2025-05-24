/**
 * Webpack config to bundle TypeScript code for a VS Code extension.
 * - Compiles .ts files into dist/extension.js
 * - Webpack is needed because VS Code runs .js, not .ts
 */

// Converts .ts to.js when "npm run compile" is run

const path = require("path");

module.exports = {
    mode: "development",        // Keep output readable (not minified)
    target: "node",             // Bundle for Node.js (not browser)

    entry: "./src/extension.ts",
    output: {
        path: path.resolve(__dirname, "dist"), // Output directory
        filename: "extension.js",              // Output filename
        libraryTarget: "commonjs2",            // Module format for VS Code/Node
    },

    resolve: {
        extensions: [".ts", ".js"], // Auto-resolve these file extensions
    },

    module: {
        rules: [
            {
                test: /\.ts$/,           // Match .ts files
                use: "ts-loader",        // Transpile TypeScript to JavaScript
                exclude: /node_modules/  // Skip dependencies
            },
        ],
    },

    externals: {
        vscode: "commonjs vscode",
    },
};