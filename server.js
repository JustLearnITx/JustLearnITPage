import express, { json } from "express";
import path from "path";
import PostDB from "./src/js/data.js";
import "dotenv/config";

const __dirname = import.meta.dirname;

const app = express();

app.get("/", (req, res) => {
	PostDB.connectToDB();
	res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/api/posts", async (req, res) => {
	try {
		res.json(await PostDB.getPosts());
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/api/posts/:slug", async (req, res) => {
	try {
		res.json(await PostDB.getPostBySlug(req.params.slug));
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/api/posts", (req, res) => {
	const token = req.headers.token;
	token === process.env.TOKEN
		? res.json({ message: "OK" })
		: res.status(401).json({ error: "invalid token" });
});

app.get("/courses", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/courses.html"));
});

app.get("/linktree", (req, res) =>
	res.sendFile(path.join(__dirname, "public/pages/linktree.html")),
);

app.get("/:slug", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/post.html"));
});

app.use(express.static("./public"));

app.listen(process.env.SERVER_PORT, "0.0.0.0", () => console.log("test"));
