const insertSectionButton = document.getElementById("post-section");
const insertSourceButton = document.getElementById("post-source");
const postContentField = document.getElementById("post-content");
const postSourcesField = document.getElementById("sources-field");
const createPostButton = document.getElementById("create-post");

/**
 * Event listener for helper button which adds post section template into a field.
 **/
insertSectionButton.addEventListener("click", () => {
	postContentField.value += `<div class="post-content">
	<h3 class="post-header" id=""></h3>
    <p></p>
</div>`;
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
        rel="noopener noreferrer">
        Name of link
      </a>
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
			token: document.getElementById("token").value,
		};
		fetch("api/posts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${data.token}`,
			},
			body: JSON.stringify(data),
		});
	} else alert("Fill all fields to add a post.");
});
