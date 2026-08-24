import express from "express";
import path from "path";
import PostDB from "./src/js/data.js";

const __dirname = import.meta.dirname;

const app = express();

app.get("/", (req, res) => {
	PostDB.connectToDB();
	res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/API/posts", (req, res) => PostDB.getPostsViewJSON(res));

app.get("/courses", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/courses.html"));
});

app.get("/linktree", (req, res) =>
	res.sendFile(path.join(__dirname, "public/pages/linktree.html")),
);

app.use(express.static("./public"));

app.listen(6969, () => console.log("test"));
