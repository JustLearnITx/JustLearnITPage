const urlSlug = window.location.pathname.split("/").at(-1);

const fetchPostView = async () => {
	try {
		const response = await fetch("/api/posts/" + urlSlug);
		if (!response.ok) throw new Error(`Response status ${response.status}`);
		const result = await response.json();
		return result;
	} catch (error) {
		console.error(error.message);
	}
};

const insertPost = async () => {
	const postContainer = document.getElementById("post");
	const postData = await fetchPostView();
	const h1 = document.createElement("h1");
	h1.id = "content-header";
	h1.textContent = postData.header;
	const h2 = document.createElement("h2");
	h2.id = "content-subheader";
	h2.textContent = postData.subheader;
	postContainer.before(h1, h2);
	postContainer.innerHTML =
		postData.post_content +
		'<section id="sources" aria-labelledby="sources-heading">' +
		postData.sources +
		"</section>";
	document.body.classList.add("loaded");
};

insertPost();
