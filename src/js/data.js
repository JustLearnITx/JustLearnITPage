import sqlite3 from "sqlite3";
import "dotenv/config";

class PostDB {
	constructor() {
		this.db = null;
	}

	async connectToDB() {
		if (this.db) return;
		this.db = new sqlite3.Database(process.env.DB_PATH, (error) => {
			error ? console.error(`Error: ${error}`) : console.log("Connected to db");
		});
	}

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
}

export default new PostDB();
