/**
 * Function for fetching data about available courses.
 * @returns {Promise<Array|undefined>} Parsed data about courses or undefined.
 **/
const fetchCourseView = async () => {
	try {
		const response = await fetch("/api/courses");
		if (!response.ok) throw new Error(`Response status ${response.status}`);
		return response.json();
	} catch (error) {
		console.error(error.message);
	}
};

/**
 * Function for inserting available courses data into front end.
 **/
const insertCourses = async () => {
	const container = document.getElementById("courses-content");
	const courses = await fetchCourseView();
	if (!courses) {
		container.innerHTML = "<p>Failed to load courses.</p>";
		document.body.classList.add("loaded");
		return;
	}
	container.innerHTML = courses
		.map(
			(course) => `
			<a class="course-anchor" href="/pages/courses/${course.slug}">
			<div class="course-post" data-id="${course.id}">
				<h2 class="course-header">${course.title}</h2>
				<p class="short-desc">
					${course.short_description}
				</p>
				<time class="update-date" datetime="${course.created_at.split(" ")[0]}"
					>${new Date(course.created_at.split(" ")[0]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time
				>
			</div>
			</a>
			`,
		)
		.join("");
	document.body.classList.add("loaded");
};

insertCourses();
