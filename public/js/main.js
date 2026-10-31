/**
 * Escapes characters before inserting text into HTML.
 * @param value - text to escape.
 * @returns - escaped text.
 **/
const escapeHtml = (value) =>
	String(value ?? "").replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char],
	);

/**
 * Fetches JSON without reusing a stale browser cache.
 * @param url - API URL.
 * @returns - parsed JSON.
 **/
const fetchJson = async (url) => {
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error("failed");
	return res.json();
};

/**
 * Renders post cards in the course posts list.
 * @param posts - post rows returned by the API.
 * @param animate - whether to stagger the entrance animation.
 * shortcut: card markup is duplicated in server.js for SSR; keep both in sync.
 **/
const renderPosts = (posts, animate = false) => {
	const listEl = document.getElementById("course-posts-list");
	if (posts.length === 0) {
		listEl.innerHTML = `<p class="font-sans text-neutral-500">No posts found.</p>`;
		return;
	}
	listEl.innerHTML = posts
		.map((post, i) => {
			return `
				<a href="/posts/${escapeHtml(encodeURIComponent(post.slug))}" class="block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
					<div class="relative mb-5 rounded-card border border-white/10 bg-white/5 px-6 pt-[1.4rem] pb-4 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-card ${animate ? "motion-safe:animate-fade-up" : ""}"${animate ? ` style="animation-delay: ${Math.min(i, 8) * 50}ms"` : ""}>
						<h2 class="mb-[0.35rem] text-[1.15rem] font-sans font-bold text-white">${escapeHtml(post.header)}</h2>
						<p class="mb-[0.9rem] font-sans text-[0.95rem] text-neutral-400">${escapeHtml(post.short_description)}</p>
						${post.updated_at ? `<p class="font-mono text-[0.78rem]/[1.5] font-normal text-violet-300">${new Date(post.updated_at.split(" ")[0]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
					</div>
				</a>`;
		})
		.join("");
};

/**
 * Renders course cards in the courses list.
 * @param courses - course rows returned by the API.
 * @param animate - whether to stagger the entrance animation.
 **/
const renderCourses = (courses, animate = false) => {
	const list = document.getElementById("courses-list");

	if (courses.length === 0) {
		list.innerHTML = `<p class="font-sans text-neutral-500">No courses found.</p>`;
		return;
	}

	list.innerHTML = courses
		.map((course, i) => {
			const count = allPosts.filter((p) => p.course_id === course.id).length;

			return `
				<a href="/courses/${escapeHtml(encodeURIComponent(course.slug))}" class="block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
					<div class="relative mb-5 rounded-card border border-white/10 bg-white/5 px-6 pt-[1.4rem] pb-4 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-card ${animate ? "motion-safe:animate-fade-up" : ""}"${animate ? ` style="animation-delay: ${Math.min(i, 8) * 50}ms"` : ""}>
						<h2 class="mb-[0.35rem] text-[1.15rem] font-sans font-bold text-white">${escapeHtml(course.title)}</h2>
						<p class="mb-[0.9rem] font-sans text-[0.95rem] text-neutral-400">${escapeHtml(course.short_description)}</p>
						<p class="font-mono text-[0.78rem]/[1.5] font-normal text-violet-300">${count} ${count === 1 ? "Post" : "Posts"}</p>
					</div>
				</a>`;
		})
		.join("");
};

/**
 * Fetches a course and its posts for the search field.
 * Keeps server-rendered content when it is available.
 * @param slug - course slug from the URL.
 **/
const loadCourse = async (slug) => {
	const titleEl = document.getElementById("course-posts-title");
	const descEl = document.getElementById("course-posts-desc");
	const listEl = document.getElementById("course-posts-list");
	const qp = document.getElementById("qp");
	const hadContent = listEl.children.length > 0;

	try {
		const data = await fetchJson(`/api/courses/${encodeURIComponent(slug)}`);
		const course = data[0];

		if (!course) {
			if (!hadContent) {
				listEl.innerHTML = `<p class="font-sans text-neutral-500">Course not found.</p>`;
			}
			return;
		}

		const posts = data.filter((row) => row.post_id);
		currentPosts = posts;
		if (hadContent) return;

		titleEl.textContent = course.title;
		descEl.textContent = course.course_description || "";

		if (posts.length === 0) {
			listEl.innerHTML = `<p class="font-sans text-neutral-500">No posts yet.</p>`;
			qp.classList.add("hidden");
			return;
		}

		qp.classList.remove("hidden");
		renderPosts(posts, !hadContent);
	} catch (e) {
		if (!hadContent) {
			listEl.innerHTML = `<p class="font-sans text-neutral-500">Failed to load posts.</p>`;
		}
	}
};

/**
 * Fills the post page only when the server did not already render it.
 * @param slug - post slug from the URL.
 **/
const loadPost = async (slug) => {
	const titleEl = document.getElementById("post-title");
	const subEl = document.getElementById("post-subheader");
	const contentEl = document.getElementById("post-content");
	if (contentEl.children.length > 0) return;

	try {
		const post = await fetchJson(`/api/posts/${encodeURIComponent(slug)}`);

		titleEl.textContent = post.header || "";
		subEl.textContent = post.subheader || "";
		contentEl.innerHTML =
			(post.post_content || "") +
			(post.sources
				? `<section id="sources">${post.sources}</section>`
				: "");

		contentEl.querySelectorAll("img").forEach((img) => {
			img.loading = "lazy";
			img.decoding = "async";
		});

		if (post.course_slug) {
			document.getElementById("post-back").href =
				`/courses/${encodeURIComponent(post.course_slug)}`;
		}
	} catch (e) {
		contentEl.innerHTML = `<p class="font-sans text-neutral-500">Failed to load post.</p>`;
	}
};

/** Whether the courses page has already fetched its data. **/
let loaded = false;
/** Courses and posts returned by the API, shared by the renderers. **/
let allCourses = [];
let allPosts = [];
/** Posts of the course currently shown, used by the search field. **/
let currentPosts = [];

/**
 * Fetches courses and posts once, then fills the courses page.
 * Keeps the server-rendered content when the request fails.
 **/
async function loadCourses() {
	if (loaded) return;
	loaded = true;

	const meta = document.getElementById("courses-meta");
	const listEl = document.getElementById("courses-list");
	const hadContent = listEl.children.length > 0;

	try {
		[allCourses, allPosts] = await Promise.all([
			fetchJson("/api/courses"),
			fetchJson("/api/posts"),
		]);

		if (hadContent) return;

		meta.textContent = `${allCourses.length} ${allCourses.length === 1 ? "Course" : "Courses"} · ${allPosts.length} ${allPosts.length === 1 ? "Post" : "Posts"}`;

		renderCourses(allCourses, !hadContent);
	} catch (e) {
		loaded = false;
		if (!hadContent) {
			meta.textContent = "";
			listEl.innerHTML = `<p class="font-sans text-neutral-500">Failed to load courses.</p>`;
		}
	}
}

/**
 * Filters the rendered posts by the query typed into the course search field.
 **/
document.getElementById("qp").addEventListener("input", (e) => {
	const query = e.target.value.trim().toLowerCase();
	if (!currentPosts.length) return;
	renderPosts(
		currentPosts.filter(
			(p) =>
				(p.header || "").toLowerCase().includes(query) ||
				(p.short_description || "").toLowerCase().includes(query),
		),
	);
});

/**
 * Filters the rendered courses by the query typed into the courses search field.
 **/
document.getElementById("q").addEventListener("input", (e) => {
	const query = e.target.value.trim().toLowerCase();
	if (!allCourses.length) return;

	renderCourses(
		allCourses.filter(
			(c) =>
				c.title.toLowerCase().includes(query) ||
				(c.short_description ?? "").toLowerCase().includes(query),
		),
	);
});

const route = document.documentElement.dataset.route;
const slug = decodeURIComponent(
	location.pathname.split("/").filter(Boolean).pop() || "",
);

if (route === "course") loadCourse(slug);
else if (route === "post") loadPost(slug);
else if (route === "courses") loadCourses();
