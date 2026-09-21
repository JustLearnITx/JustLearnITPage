import { readdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
import { minify } from "@node-minify/core";
import { terser } from "@node-minify/terser";
import { lightningCss } from "@node-minify/lightningcss";
import { htmlMinifier } from "@node-minify/html-minifier";
import { createHash } from "crypto";
import path from "path";

/**
 * Maps unhashed source names (e.g. "app.js", "style.css") to their hashed
 * dist names so HTML can be rewritten to reference them. Populated as a side
 * effect of minifyJS/minifyCSS.
 */
const assetMap = {};

/**
 * Short (6-char) MD5 hash of content, used for cache-busting filenames.
 * @param content - Content to hash.
 * @returns {string} First 6 hex characters of the MD5 digest.
 */
const getHash = (content) =>
	createHash("md5").update(content).digest("hex").slice(0, 6);

/**
 * Minifies every JS file in public/js into dist/js, renames each to
 * &lt;name&gt;.&lt;hash&gt;.js for cache busting, and records the old->new name in
 * assetMap.
 */
const minifyJS = async () => {
	const files = readdirSync("public/js");
	await Promise.all(
		files.map(async (file) => {
			await minify({
				compressor: terser,
				input: `public/js/${file}`,
				output: `dist/js/${file}`,
			});
			const content = readFileSync(`dist/js/${file}`, "utf-8");
			const hash = getHash(content);
			const outputFile = `${file.split(".")[0]}.${hash}.js`;
			const outputPath = path.join("dist/js", outputFile);
			writeFileSync(outputPath, content);
			unlinkSync(`dist/js/${file}`);
			assetMap[file] = outputFile;
		}),
	);
};

/**
 * Minifies public/css/style.css into dist/css/style.&lt;hash&gt;.css and records
 * the old->new name in assetMap.
 */
const minifyCSS = async () => {
	await minify({
		compressor: lightningCss,
		input: "public/css/style.css",
		output: "dist/css/style.css",
	});
	const content = readFileSync("dist/css/style.css", "utf-8");
	const hash = getHash(content);
	const outputFile = `style.${hash}.css`;
	const outputPath = path.join("dist/css", outputFile);
	writeFileSync(outputPath, content);
	unlinkSync("dist/css/style.css");
	assetMap["style.css"] = outputFile;
};

/**
 * Minifies public/index.html into dist/index.html and every file in
 * public/pages into dist/pages, then replaces asset references in all HTML
 * with their hashed names from assetMap. Must run after minifyJS/minifyCSS
 * so the map is populated.
 */
const minifyHTML = async () => {
	await minify({
		compressor: htmlMinifier,
		input: "public/index.html",
		output: "dist/index.html",
	});
	let indexContent = readFileSync("dist/index.html", "utf-8");
	for (const [oldName, newName] of Object.entries(assetMap)) {
		indexContent = indexContent.replaceAll(oldName, newName);
	}
	writeFileSync("dist/index.html", indexContent);

	const files = readdirSync("public/pages");
	await Promise.all(
		files.map(async (file) => {
			await minify({
				compressor: htmlMinifier,
				input: `public/pages/${file}`,
				output: `dist/pages/${file}`,
			});
			let content = readFileSync(`dist/pages/${file}`, "utf-8");
			for (const [oldName, newName] of Object.entries(assetMap)) {
				content = content.replaceAll(oldName, newName);
			}
			writeFileSync(`dist/pages/${file}`, content);
		}),
	);
};

/**
 * Builds dist/: minifies JS and CSS in parallel, then minifies and rewrites
 * HTML asset references. Mirrors dist/ layout of public/.
 */
const build = async () => {
	await Promise.all([minifyJS(), minifyCSS()]);
	await minifyHTML();
};

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
