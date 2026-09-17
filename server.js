import express, { json } from "express";
import path from "path";
import PostDB from "./src/js/data.js";
import "dotenv/config";
import compression from "compression";

const __dirname = import.meta.dirname;

const app = express();

app.use(json());
app.use(compression());

/**
 * Function for sending static file to the client.
 * @param {Object} res - object of the Express server response.
 * @param {string} relativePath - relative path to the rendered web file.
 **/
const sendPage = (res, relativePath) => {
	res.sendFile(
		path.join(__dirname, process.env.STATIC_FILES_DIR, relativePath),
	);
};

app.get("/", (req, res) => sendPage(res, "index.html"));

app.get("/api/posts", async (req, res) => {
	try {
		res.set(
			"Cache-Control",
			`public, max-age=${process.env.POSTS_LIST_CACHE_MAX_AGE}`,
		);
		res.json(await PostDB.getPosts());
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error." });
	}
});

app.get("/api/posts/:slug", async (req, res) => {
	try {
		res.set(
			"Cache-Control",
			`public, max-age=${process.env.POST_DETAIL_CACHE_MAX_AGE}`,
		);
		res.json(await PostDB.getPostBySlug(req.params.slug));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error." });
	}
});

app.post("/api/posts", async (req, res) => {
	const token = req.headers.authorization.replace("Bearer ", "");
	if (token === process.env.TOKEN) {
		try {
			const requiredFields = [
				"slug",
				"header",
				"subheader",
				"shortDescription",
				"postContent",
				"postSources",
			];
			const missingFields = requiredFields.filter((field) => !req.body[field]);
			if (missingFields.length !== 0)
				return res.status(400).json({
					error: `Missing required fields ${missingFields.join(", ")}`,
				});
			await PostDB.createPost(req.body);
			res.json({ message: "Post created." });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error." });
		}
	} else res.status(401).json({ error: "Invalid token." });
});

app.get("/courses", (req, res) => sendPage(res, "pages/courses.html"));

app.get("/linktree", (req, res) => sendPage(res, "pages/linktree.html"));

app.get("/admin", (req, res) => sendPage(res, "pages/admin.html"));

app.get("/pages/post/:slug", (req, res) => sendPage(res, "pages/post.html"));

app.use(
	express.static(process.env.STATIC_FILES_DIR, {
		maxAge: process.env.STATIC_CACHE_MAX_AGE,
	}),
);

app.listen(
	process.env.SERVER_PORT,
	"0.0.0.0",
	() => console.log("Server is on"),
	console.log("test2"),
);
