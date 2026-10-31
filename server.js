import express, { json } from "express";
import path from "path";
import { readFileSync } from "fs";
import PostDB from "./src/js/data.js";
import "dotenv/config";
import compression from "compression";
import {
	api,
	rateLimit,
	requireToken,
	requireFields,
} from "./src/js/helper.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

/**
 * Adds baseline browser security headers and keeps admin pages out of search.
 * @param req - Express request.
 * @param res - Express response.
 * @param next - callback which passes control to the next middleware.
 **/
app.use((req, res, next) => {
	res.set({
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
		"Content-Security-Policy":
			"default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
	});
	if (req.path.startsWith("/admin") || req.path.startsWith("/pages/")) {
		res.set("X-Robots-Tag", "noindex, nofollow");
	}
	next();
});

app.use("/api", rateLimit({ windowMs: 60_000, max: 120 }));
app.use(json({ limit: "1mb" }));
app.use(compression());

const writeLimiter = rateLimit({ windowMs: 60_000, max: 10 });

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
 * Escapes characters that are not allowed in HTML/XML text.
 * @param value - text to escape.
 * @returns - escaped text.
 **/
const escapeXml = (value) =>
	String(value ?? "").replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[char],
	);

/**
 * Absolute site URL used by canonical links, the sitemap and RSS.
 * @param req - Express request, used as a fallback when DOMAIN is unset.
 * @returns - site origin without a trailing slash.
 **/
const siteUrl = (req) =>
	process.env.DOMAIN
		? `https://${process.env.DOMAIN}`
		: `${req.protocol}://${req.get("host")}`;

/**
 * Formats a SQLite timestamp for display next to a post.
 * @param value - SQLite timestamp.
 * @returns - readable date or an empty string.
 **/
const displayDate = (value) => {
	const date = new Date(`${String(value).split(" ")[0]}T00:00:00Z`);
	return Number.isNaN(date.getTime())
		? ""
		: date.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "long",
				year: "numeric",
				timeZone: "UTC",
			});
};

/**
 * Converts a SQLite timestamp to ISO 8601 for JSON-LD.
 * @param value - SQLite timestamp.
 * @returns - ISO timestamp or undefined when the value is invalid.
 **/
const isoDate = (value) => {
	const date = new Date(`${String(value).replace(" ", "T")}Z`);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/**
 * Adds lazy loading to post images that do not already declare it.
 * @param html - raw post HTML.
 * @returns - HTML with lazy images.
 **/
const lazyImages = (html) =>
	String(html).replace(
		/<img\b(?![^>]*\sloading\s*=)/gi,
		'<img loading="lazy" decoding="async"',
	);

/**
 * Renders course cards for the server-rendered /courses page.
 * shortcut: the same markup lives in public/js/main.js; keep both in sync.
 * @param courses - course rows.
 * @param posts - public post rows used for per-course counts.
 * @returns - HTML string.
 **/
const renderCourseCards = (courses, posts) => {
	if (courses.length === 0) {
		return `<p class="font-sans text-neutral-500">No courses found.</p>`;
	}

	const counts = new Map();
	for (const post of posts) {
		counts.set(post.course_id, (counts.get(post.course_id) ?? 0) + 1);
	}

	return courses
		.map((course) => {
			const count = counts.get(course.id) ?? 0;
			return `
				<a href="/courses/${escapeXml(encodeURIComponent(course.slug))}" class="block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
					<div class="relative mb-5 rounded-card border border-white/10 bg-white/5 px-6 pt-[1.4rem] pb-4 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-card">
						<h2 class="mb-[0.35rem] text-[1.15rem] font-sans font-bold text-white">${escapeXml(course.title)}</h2>
						<p class="mb-[0.9rem] font-sans text-[0.95rem] text-neutral-400">${escapeXml(course.short_description)}</p>
						<p class="font-mono text-[0.78rem]/[1.5] font-normal text-violet-300">${count} ${count === 1 ? "Post" : "Posts"}</p>
					</div>
				</a>`;
		})
		.join("");
};

/**
 * Renders post cards for a course page.
 * shortcut: the same markup lives in public/js/main.js; keep both in sync.
 * @param posts - public post rows.
 * @returns - HTML string.
 **/
const renderPostCards = (posts) =>
	posts
		.map((post) => {
			const date = displayDate(post.updated_at);
			return `
				<a href="/posts/${escapeXml(encodeURIComponent(post.slug))}" class="block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
					<div class="relative mb-5 rounded-card border border-white/10 bg-white/5 px-6 pt-[1.4rem] pb-4 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-card">
						<h2 class="mb-[0.35rem] text-[1.15rem] font-sans font-bold text-white">${escapeXml(post.header)}</h2>
						<p class="mb-[0.9rem] font-sans text-[0.95rem] text-neutral-400">${escapeXml(post.short_description)}</p>
						${date ? `<p class="font-mono text-[0.78rem]/[1.5] font-normal text-violet-300">${escapeXml(date)}</p>` : ""}
					</div>
				</a>`;
		})
		.join("");

/**
 * Serializes JSON-LD without letting DB text close the script tag.
 * @param data - JSON-LD object.
 * @returns - safe JSON string.
 **/
const serializeJsonLd = (data) =>
	JSON.stringify(data ?? null)
		.replaceAll("<", "\\u003c")
		.replaceAll("\u2028", "\\u2028")
		.replaceAll("\u2029", "\\u2029");

/**
 * Sends the shell with page-specific SEO tags, JSON-LD and server-rendered
 * content. The client re-renders the same content after fetching the API.
 * @param res - Express response.
 * @param page - page metadata and server-rendered content slots.
 **/
const renderIndex = (res, page) => {
	const template = readFileSync(
		path.join(import.meta.dirname, process.env.STATIC_FILES_DIR, "index.html"),
		"utf-8",
	);

	const tokens = {
		__TITLE__: escapeXml(page.title),
		__DESCRIPTION__: escapeXml(page.description),
		__CANONICAL__: escapeXml(page.canonical),
		__OG_TYPE__: page.ogType,
		__ROUTE__: page.route,
		__OG_IMAGE__: escapeXml(page.ogImage ?? ""),
		__JSON_LD__: serializeJsonLd(page.jsonLd),
		__GOOGLE_VERIFICATION__: escapeXml(
			process.env.GOOGLE_SITE_VERIFICATION ?? "",
		),
		__COURSES_META__: escapeXml(page.coursesMeta ?? ""),
		__COURSES_LIST__: page.coursesList ?? "",
		__COURSE_TITLE__: escapeXml(page.courseTitle ?? ""),
		__COURSE_DESC__: escapeXml(page.courseDescription ?? ""),
		__COURSE_POSTS__: page.coursePosts ?? "",
		__QP_HIDDEN__: page.qpHidden ?? "hidden",
		__POST_BACK__: escapeXml(page.postBack ?? "/courses"),
		__POST_TITLE__: escapeXml(page.postTitle ?? ""),
		__POST_SUBHEADER__: escapeXml(page.postSubheader ?? ""),
		__POST_CONTENT__: page.postContent ?? "",
	};

	res
		.type("html")
		.set("Cache-Control", "no-cache")
		.send(template.replace(/__[A-Z0-9_]+__/g, (token) => tokens[token] ?? ""));
};

/**
 * Sends the standalone HTML 404 page.
 * @param res - Express response.
 **/
const sendNotFound = (res) =>
	res.status(404).type("html").set("Cache-Control", "no-cache")
		.send(`<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="robots" content="noindex" />
		<title>Page not found | JustLearnIT</title>
		<style>
			body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #08090c; color: #e5e5e5; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; padding: 2rem; }
			a { color: #67e8f9; }
		</style>
	</head>
	<body>
		<div>
			<h1>404</h1>
			<p>That page does not exist.</p>
			<p><a href="/">Back to JustLearnIT</a></p>
		</div>
	</body>
</html>`);

/**
 * Rejects a new post when its course does not exist.
 * @param req - Express request with the new post data.
 * @param res - Express response.
 * @param next - callback which passes control to the next middleware.
 **/
const requireCourse = async (req, res, next) => {
	try {
		const courses = await PostDB.getCourses();
		if (!courses.some((course) => String(course.id) === req.body.courseID)) {
			return res.status(400).json({ error: "Invalid courseID." });
		}
		next();
	} catch (error) {
		next(error);
	}
};

/**
 * Courses api endpoints
 **/
/**
 * Returns all courses.
 **/
app.get(
	"/api/courses",
	api(() => PostDB.getCourses(), process.env.POSTS_LIST_CACHE_MAX_AGE),
);

/**
 * Returns a course with its public posts by slug.
 * @param req - Express request with the course slug in params.
 **/
app.get(
	"/api/courses/:slug",
	api(
		(req) => PostDB.getCourseBySlug(req.params.slug),
		process.env.POST_DETAIL_CACHE_MAX_AGE,
		(course) => course.length === 0,
	),
);

/**
 * Creates a course from the request body.
 * @param req - Express request with the new course data.
 **/
app.post(
	"/api/courses",
	writeLimiter,
	requireToken,
	requireFields(["slug", "title", "shortDescription"], {
		slug: 120,
		title: 200,
		shortDescription: 500,
	}),
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
/**
 * Returns all public posts.
 **/
app.get(
	"/api/posts",
	api(() => PostDB.getPosts(), process.env.POSTS_LIST_CACHE_MAX_AGE),
);

/**
 * Returns a public post by slug.
 * @param req - Express request with the post slug in params.
 **/
app.get(
	"/api/posts/:slug",
	api(
		(req) => PostDB.getPostBySlug(req.params.slug),
		process.env.POST_DETAIL_CACHE_MAX_AGE,
		(post) => !post,
	),
);

/**
 * Creates a post from the request body.
 * @param req - Express request with the new post data.
 **/
app.post(
	"/api/posts",
	writeLimiter,
	requireToken,
	requireFields(
		[
			"slug",
			"header",
			"subheader",
			"shortDescription",
			"postContent",
			"postSources",
			"courseID",
		],
		{
			slug: 120,
			header: 200,
			subheader: 500,
			shortDescription: 500,
			postContent: 900_000,
			postSources: 100_000,
			courseID: 20,
		},
	),
	requireCourse,
	api(
		async (req) => (
			await PostDB.createPost(req.body),
			{ message: "Post created." }
		),
	),
);

/**
 * Returns the number of courses and posts.
 **/
app.get(
	"/api/stats",
	api(async () => {
		const [courses, posts] = await Promise.all([
			PostDB.getCourses(),
			PostDB.getPosts(),
		]);
		return { courses: courses.length, posts: posts.length };
	}, process.env.POSTS_LIST_CACHE_MAX_AGE),
);

/**
 * Sends the latest public posts as an RSS feed.
 **/
app.get("/rss.xml", async (req, res) => {
	const posts = await PostDB.getPosts();
	const site = siteUrl(req);
	const date = (value) =>
		new Date(String(value).replace(" ", "T") + "Z").toUTCString();

	const latest = posts.slice(0, 20);

	const items = latest
		.map(
			(post) => `
		<item>
			<title>${escapeXml(post.header)}</title>
			<link>${site}/posts/${escapeXml(encodeURIComponent(post.slug))}</link>
			<guid isPermaLink="false">${escapeXml(post.slug)}</guid>
			<pubDate>${date(post.updated_at)}</pubDate>
			<description>${escapeXml(post.short_description)}</description>
		</item>`,
		)
		.join("");

	const lastBuildDate = latest[0]
		? `<lastBuildDate>${date(latest[0].updated_at)}</lastBuildDate>`
		: "";

	res
		.type("application/rss+xml")
		.set(
			"Cache-Control",
			`public, max-age=${process.env.POSTS_LIST_CACHE_MAX_AGE}`,
		).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>JustLearnIT</title>
		<link>${site}/</link>
		<description>Free IT courses and resources.</description>
		<language>en</language>
		${lastBuildDate}${items}
	</channel>
</rss>`);
});

/**
 * SEO routes
 **/

/**
 * Redirects the old index path to the canonical home page.
 **/
app.get("/index.html", (req, res) => res.redirect(301, "/"));

/**
 * Sends the home page shell.
 **/
app.get("/", (req, res) => {
	const site = siteUrl(req);
	renderIndex(res, {
		title: "Just Learn IT | Learn, grow.",
		description: "JustLearnIT - Learn, grow. Free IT courses and resources.",
		canonical: `${site}/`,
		ogType: "website",
		route: "home",
		ogImage: `${site}/img/og.png`,
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: "JustLearnIT",
			description: "Free IT courses and resources.",
			url: `${site}/`,
		},
	});
});

/**
 * Sends the courses page with server-rendered course cards.
 **/
app.get("/courses", async (req, res, next) => {
	try {
		const [courses, posts] = await Promise.all([
			PostDB.getCourses(),
			PostDB.getPosts(),
		]);
		const site = siteUrl(req);

		renderIndex(res, {
			title: "Courses | JustLearnIT",
			description: "Browse free IT courses and resources on JustLearnIT.",
			canonical: `${site}/courses`,
			ogType: "website",
			route: "courses",
			ogImage: `${site}/img/og.png`,
			coursesMeta: `${courses.length} ${
				courses.length === 1 ? "Course" : "Courses"
			} · ${posts.length} ${posts.length === 1 ? "Post" : "Posts"}`,
			coursesList: renderCourseCards(courses, posts),
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "Courses",
				description: "Browse free IT courses and resources on JustLearnIT.",
				url: `${site}/courses`,
				mainEntity: {
					"@type": "ItemList",
					itemListElement: courses.map((course, index) => ({
						"@type": "ListItem",
						position: index + 1,
						name: course.title,
						url: `${site}/courses/${encodeURIComponent(course.slug)}`,
					})),
				},
			},
		});
	} catch (error) {
		next(error);
	}
});

/**
 * Sends a course page with its server-rendered post cards.
 * @param req - Express request with the course slug in params.
 **/
app.get("/courses/:slug", async (req, res, next) => {
	try {
		const course = await PostDB.getCourseBySlug(req.params.slug);
		if (course.length === 0) return sendNotFound(res);

		const site = siteUrl(req);
		const first = course[0];
		const posts = course.filter((row) => row.post_id);
		const canonical = `${site}/courses/${encodeURIComponent(req.params.slug)}`;

		renderIndex(res, {
			title: `${first.title} | JustLearnIT`,
			description:
				first.course_description ||
				`Free ${first.title} courses and resources on JustLearnIT.`,
			canonical,
			ogType: "website",
			route: "course",
			ogImage: `${site}/img/og.png`,
			courseTitle: first.title,
			courseDescription: first.course_description || "",
			coursePosts:
				posts.length > 0
					? renderPostCards(posts)
					: `<p class="font-sans text-neutral-500">No posts yet.</p>`,
			qpHidden: posts.length > 0 ? "" : "hidden",
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "Course",
				name: first.title,
				description:
					first.course_description ||
					`Free ${first.title} courses and resources on JustLearnIT.`,
				url: canonical,
				provider: {
					"@type": "Organization",
					name: "JustLearnIT",
					sameAs: `${site}/`,
				},
			},
		});
	} catch (error) {
		next(error);
	}
});

/**
 * Sends a post page with its server-rendered content.
 * @param req - Express request with the post slug in params.
 **/
app.get("/posts/:slug", async (req, res, next) => {
	try {
		const post = await PostDB.getPostBySlug(req.params.slug);
		if (!post) return sendNotFound(res);

		const site = siteUrl(req);
		const canonical = `${site}/posts/${encodeURIComponent(req.params.slug)}`;
		const published = isoDate(post.created_at);
		const modified = isoDate(post.updated_at);

		renderIndex(res, {
			title: `${post.header} | JustLearnIT`,
			description: post.subheader || `Read ${post.header} on JustLearnIT.`,
			canonical,
			ogType: "article",
			route: "post",
			ogImage: `${site}/img/og.png`,
			postBack: `/courses/${encodeURIComponent(post.course_slug)}`,
			postTitle: post.header,
			postSubheader: post.subheader || "",
			postContent: lazyImages(
				(post.post_content || "") +
					(post.sources
						? `<section id="sources">${post.sources}</section>`
						: ""),
			),
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "BlogPosting",
				headline: post.header,
				description: post.subheader || `Read ${post.header} on JustLearnIT.`,
				url: canonical,
				mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
				image: `${site}/img/og.png`,
				...(published ? { datePublished: published } : {}),
				...(modified ? { dateModified: modified } : {}),
				author: {
					"@type": "Organization",
					name: "JustLearnIT",
					url: `${site}/`,
				},
				publisher: {
					"@type": "Organization",
					name: "JustLearnIT",
					logo: { "@type": "ImageObject", url: `${site}/img/og.png` },
				},
			},
		});
	} catch (error) {
		next(error);
	}
});

/**
 * Sends the sitemap for all public pages.
 **/
app.get("/sitemap.xml", async (req, res) => {
	const [courses, posts] = await Promise.all([
		PostDB.getCourses(),
		PostDB.getPosts(),
	]);
	const site = siteUrl(req);
	const url = (loc, lastmod) =>
		`<url><loc>${escapeXml(loc)}</loc>${
			lastmod ? `<lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : ""
		}</url>`;

	const urls = [
		url(`${site}/`),
		url(`${site}/courses`),
		...courses.map((course) =>
			url(
				`${site}/courses/${encodeURIComponent(course.slug)}`,
				course.created_at,
			),
		),
		...posts.map((post) =>
			url(`${site}/posts/${encodeURIComponent(post.slug)}`, post.updated_at),
		),
	].join("");

	res
		.type("application/xml")
		.set(
			"Cache-Control",
			`public, max-age=${process.env.POSTS_LIST_CACHE_MAX_AGE}`,
		).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

/**
 * Other endpoints
 **/

/**
 * Sends the admin pages.
 **/
app.get("/admin", (req, res) => sendPage(res, "pages/admin.html"));

app.get("/admin-courses", (req, res) =>
	sendPage(res, "pages/admin-course.html"),
);

/**
 * Serves built static files with long-lived caching for hashed assets.
 **/
app.use(
	express.static(process.env.STATIC_FILES_DIR, {
		maxAge: process.env.STATIC_CACHE_MAX_AGE,
		setHeaders: (res, filePath) => {
			if (filePath.endsWith(".html")) {
				res.setHeader("Cache-Control", "no-cache");
			} else if (/\.[0-9a-f]{6}\.(?:js|css)$/.test(filePath)) {
				res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
			}
		},
	}),
);

/**
 * Returns a JSON 404 for unknown API routes and the HTML 404 page otherwise.
 **/
app.use((req, res) => {
	if (req.path.startsWith("/api/")) {
		return res.status(404).json({ error: "Not found." });
	}
	sendNotFound(res);
});

/**
 * Handles malformed requests and unexpected errors.
 * @param err - error passed by Express or a route.
 * @param req - Express request.
 * @param res - Express response.
 * @param next - callback used when the response has already started.
 **/
app.use((err, req, res, next) => {
	if (res.headersSent) return next(err);
	if (err.type === "entity.too.large") {
		return res.status(413).json({ error: "Request body too large." });
	}
	if (err.type === "entity.parse.failed") {
		return res.status(400).json({ error: "Invalid JSON." });
	}

	console.error(err);
	if (req.path.startsWith("/api/")) {
		return res.status(500).json({ error: "Internal server error." });
	}
	res.status(500).type("text").send("Internal server error.");
});

/**
 * Starts the HTTP server.
 **/
app.listen(process.env.SERVER_PORT, "0.0.0.0", () =>
	console.log("Server is on"),
);
