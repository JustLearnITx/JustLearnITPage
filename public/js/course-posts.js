const urlSlug = window.location.pathname.split("/").at(-1);

/**
 * Function for fetching data about specific post.
 * @returns {Promise<Object|undefined>} Parsed data about post or undefined.
 **/
const fetchPostView = async () => {
	try {
		const response = await fetch("/api/courses/" + urlSlug);
		if (!response.ok) throw new Error(`Response status ${response.status}`);
		return response.json();
	} catch (error) {
		console.error(error.message);
	}
};

/**
 * Function for inserting post content into front end.
 **/
const insertPost = async () => {
	const postContainer = document.getElementById("courses-content");
	const postData = await fetchPostView();
	if (!postData) {
		postContainer.innerHTML = "<p>Failed to load post.</p>";
		document.body.classList.add("loaded");
		return;
	}

	const posts = postData.filter((row) => row.post_id);

	const h1 = document.createElement("h1");
	h1.id = "content-header";
	h1.textContent = postData[0].title;
	const h2 = document.createElement("h2");
	h2.id = "content-subheader";
	h2.textContent = postData[0].course_description;
	postContainer.before(h1, h2);

	if (!posts.length) {
		postContainer.innerHTML = "<p>No posts yet.</p>";
		document.body.classList.add("loaded");
		return;
	}

	postContainer.innerHTML = posts
		.map(
			(post) => `
			<a class="course-anchor" href="/pages/post/${post.slug}">
			<div class="course-post" data-id="${post.post_id}">
				<h2 class="course-header">${post.header}</h2>
				<p class="short-desc">
					${post.short_description}
				</p>
				<time class="update-date" datetime="${post.updated_at.split(" ")[0]}"
					>${new Date(post.updated_at.split(" ")[0]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time
				>
			</div>
			</a>
			`,
		)
		.join("");
	document.body.classList.add("loaded");
};

insertPost();
