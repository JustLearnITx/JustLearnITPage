import { readdirSync } from "fs";
import { minify } from "@node-minify/core";
import { terser } from "@node-minify/terser";
import { lightningCss } from "@node-minify/lightningcss";
import { minifyHtml } from "@node-minify/minify-html";

/**
 * Function used to minify all JavaScript files used by static web content.
 **/
const minifyJS = async () => {
	const files = readdirSync("public/js");
	await Promise.all(
		files.map((file) =>
			minify({
				compressor: terser,
				input: `public/js/${file}`,
				output: `dist/js/${file}`,
			}),
		),
	);
};

/**
 * Function used to minify CSS file used in the app.
 **/
const minifyCSS = async () => {
	await minify({
		compressor: lightningCss,
		input: "public/css/style.css",
		output: "dist/css/style.css",
	});
};

/**
 * Function used to minify all HTML files used in the app.
 **/
const minifyHTML = async () => {
	await minify({
		compressor: minifyHtml,
		input: "public/index.html",
		output: "dist/index.html",
	});

	const files = readdirSync("public/pages");
	await Promise.all(
		files.map((file) =>
			minify({
				compressor: minifyHtml,
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
