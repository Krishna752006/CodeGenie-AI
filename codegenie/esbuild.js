const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

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
		sourcemap: !production, // Enable sourcemaps in development
		sourcesContent: false, // Exclude original source content from sourcemaps
		platform: 'node', // Target Node.js environment
		outfile: 'dist/extension.js', // Output file path
		external: ['vscode'], // Treat 'vscode' as external (do not bundle)
		logLevel: 'silent', // Suppress esbuild's default logging
		plugins: [
			// Attach problem matcher plugin as the last plugin
			esbuildProblemMatcherPlugin,
		],
	});

	if (watch) {
		// Watch mode: automatically rebuild on file changes
		await ctx.watch();
	} else {
		// Single build: rebuild once and then dispose
		await ctx.rebuild();
		await ctx.dispose();
	}
}

// Start build process and handle any unexpected errors
main().catch(e => {
	console.error(e);
	process.exit(1);
});
