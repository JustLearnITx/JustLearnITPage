const insertSectionButton = document.getElementById("post-section");
const insertSourceButton = document.getElementById("post-source");
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
 * Event listener for helper button which adds post section template into a field.
 **/
insertSectionButton.addEventListener("click", () => {
	postContentField.value += `<div class="post-content">
	<h3 class="post-header" id=""></h3>
	<p></p>
</div>
`;
});

/**
 * Event listener for helper button which adds post source template into a field.
 **/
insertSourceButton.addEventListener("click", () => {
	postSourcesField.value += `<h3 class="post-header" id="sources-heading">Sources</h3>
<ul>
	<li>
		<a
			href=""
			target="_blank"
			rel="noopener noreferrer"
			>Name of link</a
		>
		- Short desc
	</li>
</ul>
`;
});

/**
 * Event listener for a form button to create a post basing on the data in the form.
 **/
createPostButton.addEventListener("click", () => {
	if (document.querySelector("form").checkValidity()) {
		const data = {
			slug: document.getElementById("slug").value,
			header: document.getElementById("header").value,
			subheader: document.getElementById("subheader").value,
			shortDescription: document.getElementById("short-description").value,
			postContent: postContentField.value,
			postSources: postSourcesField.value,
			courseID: document.getElementById("categories").value,
			token: document.getElementById("token").value,
		};
		fetch("/api/posts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${data.token}`,
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
