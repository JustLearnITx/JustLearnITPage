/**
 * Wraps an API handler, setting a cache header and resolving the result as JSON.
 * @param handler - async function handling the request and returning data to send.
 * @param maxAge - cache max-age in seconds, skipped when falsy.
 * @returns {Function} Express request handler.
 **/
export const api = (handler, maxAge) => async (req, res) => {
	try {
		if (maxAge) res.set("Cache-Control", `public, max-age=${maxAge}`);
		res.json(await handler(req));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error." });
	}
};

/**
 * Express middleware which requires a valid Bearer token.
 * @param req - object of the Express server request.
 * @param res - object of the Express server response.
 * @param next - callback which passes control to the next middleware.
 * @returns {*} Calls the next middleware or responds with a 401 error.
 **/
export const requireToken = (req, res, next) =>
	(req.headers.authorization || "").replace("Bearer ", "") === process.env.TOKEN
		? next()
		: res.status(401).json({ error: "Invalid token." });

/**
 * Express middleware factory requiring the given fields to be present in the request body.
 * @param fields - array of required field names.
 * @returns {Function} Express middleware which validates the request.
 **/
export const requireFields = (fields) => (req, res, next) => {
	const missing = fields.filter((field) => !req.body[field]);
	return missing.length === 0
		? next()
		: res
				.status(400)
				.json({ error: `Missing required fields ${missing.join(", ")}` });
};
