const postContentField = document.getElementById("post-content");
const postSourcesField = document.getElementById("sources-field");
const createPostButton = document.getElementById("create-post");
const courseSelect = document.getElementById("categories");

/**
 * Fills the category select with the courses from the database.
 **/
const loadCourses = async () => {
	try {
		const response = await fetch("/api/courses");
		if (!response.ok) throw new Error(`Response status ${response.status}`);
		const courses = await response.json();
		courseSelect.replaceChildren(
			...courses.map((course) => {
				const option = document.createElement("option");
				option.value = course.id;
				option.textContent = course.title;
				return option;
			}),
		);
	} catch (error) {
		alert(`Failed to load courses: ${error.message}`);
	}
};

loadCourses();

/**
 * Event listener for a form button to create a post basing on the data in the form.
 **/
createPostButton.addEventListener("click", () => {
	if (document.querySelector("form").checkValidity()) {
		const token = document.getElementById("token").value;
		const data = {
			slug: document.getElementById("slug").value,
			header: document.getElementById("header").value,
			subheader: document.getElementById("subheader").value,
			shortDescription: document.getElementById("short-description").value,
			postContent: postContentField.value,
			postSources: postSourcesField.value,
			courseID: document.getElementById("categories").value,
		};
		fetch("/api/posts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		})
			.then((response) => {
				if (response.ok) alert("Post created.");
				else alert(`Post creation failed with status ${response.status}.`);
			})
			.catch(() => alert("Failed to create post."));
	} else alert("Fill all fields to add a post.");
});
