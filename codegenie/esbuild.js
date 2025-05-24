/* 
* Takes the entry TypeScript file (src/extension.ts), transpiles it to JavaScript,
* and bundles it with all dependencies into a single output file (dist/extension.js).
*/

const esbuild = require("esbuild"); //Imports the esbuild module, which is a fast JavaScript bundler and minifier

const production = process.argv.includes('--production'); // See command Line and makes it true if --production is passed
const watch = process.argv.includes('--watch'); // See command Line and makes it true if --watch is passed

const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] Build started...');
		});

		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] Build finished.');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'cjs', // Output as CommonJS module (Node.js compatible)
		minify: production, // Minify if in production mode
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node', // Target Node.js environment
		outfile: 'dist/extension.js', // Output file path
		external: ['vscode'], // Treat 'vscode' as external (do not bundle)
		logLevel: 'silent', // Suppress esbuild's default logging
		plugins: [esbuildProblemMatcherPlugin]
	});

	if (watch) {
		await ctx.watch(); // Watch mode: automatically rebuild on file changes
	} else {
		// Single build: rebuild once and then dispose
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => { // Start build process and handle any unexpected errors
	console.error(e);
	process.exit(1);
});
