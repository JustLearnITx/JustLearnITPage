import sqlite3 from "sqlite3";

class PostDB {
	constructor() {
		this.db = null;
	}

	async connectToDB() {
		if (this.db) return;
		this.db = new sqlite3.Database("./db/database.db", (error) => {
			error ? console.error(`Error: ${error}`) : console.log("Connected to db");
		});
	}

	async getPosts() {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.all(
				"SELECT id, slug, header, subheader, short_description, is_public, created_at, updated_at FROM posts WHERE is_public = 1",
				[],
				(error, rows) => (error ? reject(error) : resolve(rows)),
			);
		});
	}
}

export default new PostDB();
