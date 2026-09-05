import express, { json } from "express";
import path from "path";
import PostDB from "./src/js/data.js";
import "dotenv/config";

const __dirname = import.meta.dirname;

const app = express();

app.use(json());

app.get("/", (req, res) => {
	PostDB.connectToDB();
	res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/api/posts", async (req, res) => {
	try {
		res.set(
			"Cache-Control",
			`public, max-age=${process.env.POSTS_LIST_CACHE_MAX_AGE}`,
		);
		res.json(await PostDB.getPosts());
	} catch (error) {
		res.status(500).json({ error: error.message });
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
		res.status(500).json({ error: error.message });
	}
});

app.post("/api/posts", async (req, res) => {
	const token = req.headers.token;
	if (token === process.env.TOKEN) {
		try {
			await PostDB.createPost(req.body);
			res.json({ message: "Post created" });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	} else res.status(401).json({ error: "invalid token" });
});

app.get("/courses", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/courses.html"));
});

app.get("/linktree", (req, res) =>
	res.sendFile(path.join(__dirname, "public/pages/linktree.html")),
);

app.get("/admin", (req, res) =>
	res.sendFile(path.join(__dirname, "public/pages/admin.html")),
);

app.get("/pages/post/:slug", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/post.html"));
});

app.use(
	express.static("./public", { maxAge: process.env.STATIC_CACHE_MAX_AGE }),
);

app.listen(process.env.SERVER_PORT, "0.0.0.0", () =>
	console.log("Server is on"),
);
