const fetchCourseView = async () => {
	try {
		const response = await fetch("/api/posts");
		if (!response.ok) throw new Error(`Response status ${response.status}`);
		const result = await response.json();
		return result;
	} catch (error) {
		console.error(error.message);
	}
};

const insertCourses = async () => {
	const container = document.getElementById("courses-content");
	const posts = await fetchCourseView();
	container.innerHTML = posts
		.map((post) => {
			const postHTMl = `
			<a class="course-anchor" href="/pages/post/${post.slug}">
			<div class="course-post" data-id="${post.id}">
				<h2 class="course-header">${post.header}</h2>
				<p class="short-desc">
					${post.short_description}
				</p>
				<time class="update-date" datetime="${post.updated_at.split(" ")[0]}"
					>${new Date(post.updated_at.split(" ")[0]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time
				>
			</div>
			</a>
			`;
			return postHTMl;
		})
		.join("");
};

insertCourses();
