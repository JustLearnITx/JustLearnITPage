import { readdirSync } from "fs";
import { minify } from "@node-minify/core";
import { terser } from "@node-minify/terser";
import { lightningCss } from "@node-minify/lightningcss";
import { minifyHtml } from "@node-minify/minify-html";

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

const minifyCSS = async () => {
	const result = await minify({
		compressor: lightningCss,
		input: "public/css/style.css",
		output: "dist/css/style.css",
	});
};

const minifyHTML = async () => {
	const result = await minify({
		compressor: minifyHtml,
		input: "public/index.html",
		output: "dist/index.html",
	});
};

// minifyJS();
// minifyCSS();
// minifyHTML();
