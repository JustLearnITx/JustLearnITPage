import { timingSafeEqual } from "crypto";

/**
 * Wraps an API handler, setting a cache header and resolving the result as JSON.
 * @param handler - async function handling the request and returning data to send.
 * @param maxAge - cache max-age in seconds, skipped when falsy.
 * @param isMissing - optional predicate marking the result as a 404.
 * @returns {Function} Express request handler.
 **/
export const api = (handler, maxAge, isMissing) => async (req, res) => {
	try {
		const data = await handler(req);
		if (isMissing?.(data)) return res.status(404).json({ error: "Not found." });
		if (maxAge) res.set("Cache-Control", `public, max-age=${maxAge}`);
		res.json(data);
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
export const requireToken = (req, res, next) => {
	const expected = process.env.TOKEN ?? "";
	const [scheme, provided = ""] = (req.headers.authorization ?? "").split(" ");
	const valid =
		expected.length > 0 &&
		scheme === "Bearer" &&
		provided.length === expected.length &&
		timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

	return valid ? next() : res.status(401).json({ error: "Invalid token." });
};

/**
 * Simple in-memory rate limiter for API routes.
 * shortcut: per-process memory, resets on restart and is not shared across replicas.
 * @param options - rate limit options.
 * @param options.windowMs - time window in milliseconds.
 * @param options.max - maximum requests per window.
 * @returns {Function} Express request handler.
 **/
export const rateLimit = ({ windowMs, max }) => {
	const hits = new Map();

	return (req, res, next) => {
		const now = Date.now();
		if (hits.size > 1000) {
			for (const [key, value] of hits) {
				if (value.resetAt <= now) hits.delete(key);
			}
		}

		const key = req.ip || req.socket.remoteAddress || "unknown";
		const entry = hits.get(key);

		if (!entry || entry.resetAt <= now) {
			hits.set(key, { count: 1, resetAt: now + windowMs });
			return next();
		}

		entry.count += 1;
		if (entry.count > max) {
			res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
			return res.status(429).json({ error: "Too many requests." });
		}

		next();
	};
};

/**
 * Express middleware factory requiring the given fields to be present, textual
 * and within their optional length limits.
 * @param fields - array of required field names.
 * @param limits - optional map of field names to maximum string lengths.
 * @returns {Function} Express middleware which validates the request.
 **/
export const requireFields =
	(fields, limits = {}) =>
	(req, res, next) => {
		if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
			return res.status(400).json({ error: "Invalid request body." });
		}

		const invalid = [];
		for (const field of fields) {
			const value = req.body[field];
			if (typeof value !== "string" || value.trim() === "") {
				invalid.push(field);
			} else if (limits[field] && value.length > limits[field]) {
				invalid.push(`${field} (too long)`);
			} else if (field === "slug" && /[\s/?#]/.test(value)) {
				invalid.push("slug (invalid format)");
			} else if (field === "courseID" && !/^\d+$/.test(value)) {
				invalid.push("courseID (invalid format)");
			}
		}

		return invalid.length === 0
			? next()
			: res
					.status(400)
					.json({ error: `Invalid required fields ${invalid.join(", ")}` });
	};
