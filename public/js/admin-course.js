const createCourseButton = document.getElementById("create-course");

/**
 * Event listener for a form button to create a course basing on the data in the form.
 **/
createCourseButton.addEventListener("click", () => {
	if (document.querySelector("form").checkValidity()) {
		const data = {
			slug: document.getElementById("slug").value,
			title: document.getElementById("title").value,
			shortDescription: document.getElementById("short-description").value,
			token: document.getElementById("token").value,
		};
		fetch("/api/courses", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${data.token}`,
			},
			body: JSON.stringify(data),
		})
			.then((response) => {
				if (response.ok) alert("Course created.");
				else alert(`Course creation failed with status ${response.status}.`);
			})
			.catch(() => alert("Failed to create course."));
	} else alert("Fill all fields to add a course.");
});
