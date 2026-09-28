import express, { json } from "express";
import path from "path";
import PostDB from "./src/js/data.js";
import "dotenv/config";
import compression from "compression";
import { api, requireToken, requireFields } from "./src/js/helper.js";

const app = express();

app.use(json());
app.use(compression());

/**
 * Function for sending static file to the client.
 * @param res - object of the Express server response.
 * @param relativePath - relative path to the rendered web file.
 **/
const sendPage = (res, relativePath) => {
	res.sendFile(
		path.join(import.meta.dirname, process.env.STATIC_FILES_DIR, relativePath),
	);
};

/**
 * Courses api endpoints
 **/
app.get(
	"/api/courses",
	api(() => PostDB.getCourses(), process.env.POSTS_LIST_CACHE_MAX_AGE),
);

app.get(
	"/api/courses/:slug",
	api(
		(req) => PostDB.getCourseBySlug(req.params.slug),
		process.env.POST_DETAIL_CACHE_MAX_AGE,
	),
);

app.post(
	"/api/courses",
	requireToken,
	requireFields(["slug", "title", "shortDescription"]),
	api(
		async (req) => (
			await PostDB.createCourse(req.body),
			{ message: "Course created." }
		),
	),
);

/**
 * Posts api endpoints
 **/
app.get(
	"/api/posts",
	api(() => PostDB.getPosts(), process.env.POSTS_LIST_CACHE_MAX_AGE),
);

app.get(
	"/api/posts/:slug",
	api(
		(req) => PostDB.getPostBySlug(req.params.slug),
		process.env.POST_DETAIL_CACHE_MAX_AGE,
	),
);

app.post(
	"/api/posts",
	requireToken,
	requireFields([
		"slug",
		"header",
		"subheader",
		"shortDescription",
		"postContent",
		"postSources",
		"courseID",
	]),
	api(
		async (req) => (
			await PostDB.createPost(req.body),
			{ message: "Post created." }
		),
	),
);

/**
 * Other endpoints
 **/

app.get("/courses", (req, res) => sendPage(res, "pages/courses.html"));

app.get("/linktree", (req, res) => sendPage(res, "pages/linktree.html"));

app.get("/admin", (req, res) => sendPage(res, "pages/admin.html"));

app.get("/admin-courses", (req, res) =>
	sendPage(res, "pages/admin-course.html"),
);

app.get("/pages/courses/:slug", (req, res) =>
	sendPage(res, "pages/course-posts.html"),
);

app.get("/pages/post/:slug", (req, res) => sendPage(res, "pages/post.html"));

app.use(
	express.static(process.env.STATIC_FILES_DIR, {
		maxAge: process.env.STATIC_CACHE_MAX_AGE,
	}),
);

app.listen(process.env.SERVER_PORT, "0.0.0.0", () =>
	console.log("Server is on"),
);
