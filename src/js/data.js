import sqlite3 from "sqlite3";
import "dotenv/config";

/** Class representing a layer of posts accessing via database. */
class PostDB {
	/**
	 * Create a database variable to be set while connecting to database.
	 **/
	constructor() {
		this.db = null;
	}

	/**
	 * Method which connects to the database.
	 * @returns {Promise<void>} Promise which resolves when database connection is done.
	 **/
	async connectToDB() {
		if (this.db) return;
		return new Promise((resolve, reject) => {
			this.db = new sqlite3.Database(process.env.DB_PATH, (error) =>
				error ? reject(error) : resolve(),
			);
		});
	}

	/**
	 * Method for getting information about public posts.
	 * @returns {Promise<Array>} Promise with array of public posts sorted from newest.
	 **/
	async getPosts() {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.all(
				"SELECT id, slug, header, subheader, short_description, is_public, updated_at FROM posts WHERE is_public = 1 ORDER BY updated_at DESC",
				[],
				(error, rows) => (error ? reject(error) : resolve(rows)),
			);
		});
	}

	/**
	 * Method for getting information about public post basing on its slug.
	 * @param slug - unique identifier of a post which is included in url.
	 * @returns {Promise<Object>} Promise with object of a single post or undefined if not found.
	 **/
	async getPostBySlug(slug) {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.get(
				"SELECT header, subheader, post_content, sources FROM posts WHERE is_public = 1 AND slug = ?",
				[slug],
				(error, row) => (error ? reject(error) : resolve(row)),
			);
		});
	}

	/**
	 * Method for creating new post in the database.
	 * @param postData - object of data of a new post.
	 * @returns {Promise<boolean>} Promise which resolves after successfully added post to database.
	 **/
	async createPost(postData) {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.run(
				"INSERT INTO posts (slug, header, subheader, short_description, post_content, sources) VALUES (?, ?, ?, ?, ?, ?)",
				[
					postData.slug,
					postData.header,
					postData.subheader,
					postData.shortDescription,
					postData.postContent,
					postData.postSources,
				],
				(error) => (error ? reject(error) : resolve(true)),
			);
		});
	}
}

export default new PostDB();
