import { readdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
import { minify } from "@node-minify/core";
import { terser } from "@node-minify/terser";
import { lightningCss } from "@node-minify/lightningcss";
import { htmlMinifier } from "@node-minify/html-minifier";
import { createHash } from "crypto";
import path from "path";

/**
 * Function to create hash based on provided content.
 * @param {string} content - Content to get hash from.
 * @returns {string} Short MD5 hash (6 characters) calculated from provided content.
 **/
const getHash = (content) =>
	createHash("md5").update(content).digest("hex").slice(0, 6);

/**
 * Function used to minify all JavaScript files used by static web content with a specific hash.
 **/
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
		}),
	);
};

/**
 * Function used to minify CSS file used in the app and write that with special hash.
 **/
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
};

/**
 * Function used to minify all HTML files used in the app.
 **/
const minifyHTML = async () => {
	await minify({
		compressor: htmlMinifier,
		input: "public/index.html",
		output: "dist/index.html",
	});

	const files = readdirSync("public/pages");
	await Promise.all(
		files.map((file) =>
			minify({
				compressor: htmlMinifier,
				input: `public/pages/${file}`,
				output: `dist/pages/${file}`,
			}),
		),
	);
};

/**
 * Function used to build all distribution files at once.
 **/
const build = async () => {
	await Promise.all([minifyJS(), minifyCSS(), minifyHTML()]);
};

build();
