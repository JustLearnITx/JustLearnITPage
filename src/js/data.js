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
			this.db.run("PRAGMA foreign_keys = ON");
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
				"SELECT id, slug, header, subheader, short_description, is_public, updated_at, course_id FROM posts WHERE is_public = 1 ORDER BY updated_at DESC",
				[],
				(error, rows) => (error ? reject(error) : resolve(rows)),
			);
		});
	}

	/**
	 * Method for getting information about all courses.
	 * @returns {Promise<Array>} Promise with array of courses sorted from newest.
	 **/
	async getCourses() {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.all(
				"SELECT id, slug, title, short_description, created_at FROM courses ORDER BY created_at DESC",
				[],
				(error, rows) => (error ? reject(error) : resolve(rows)),
			);
		});
	}

	/**
	 * Method for getting a course with its public posts basing on its slug.
	 * @param slug - unique identifier of a course which is included in url.
	 * @returns {Promise<Array>} Promise with array of course rows including its public posts.
	 **/
	async getCourseBySlug(slug) {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.all(
				`
				SELECT
  courses.id,
  courses.title,
  courses.short_description AS course_description,

  posts.id AS post_id,
  posts.slug,
  posts.header,
  posts.short_description,
  posts.updated_at

				FROM courses
				LEFT JOIN posts
  ON posts.course_id = courses.id
  		AND posts.is_public = 1

				WHERE courses.slug = ?
				ORDER BY posts.updated_at DESC;
			`,
				[slug],
				(error, row) => (error ? reject(error) : resolve(row)),
			);
		});
	}

	/**
	 * Method for creating new course in the database.
	 * @param courseData - object of data of a new course.
	 * @returns {Promise<boolean>} Promise which resolves after successfully added course to database.
	 **/
	async createCourse(courseData) {
		if (!this.db) await this.connectToDB();
		return new Promise((resolve, reject) => {
			this.db.run(
				"INSERT INTO courses (slug, title, short_description) VALUES (?, ?, ?)",
				[courseData.slug, courseData.title, courseData.shortDescription],
				(error) => (error ? reject(error) : resolve(true)),
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
				"INSERT INTO posts (slug, header, subheader, short_description, post_content, sources, course_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
				[
					postData.slug,
					postData.header,
					postData.subheader,
					postData.shortDescription,
					postData.postContent,
					postData.postSources,
					postData.courseID,
				],
				(error) => (error ? reject(error) : resolve(true)),
			);
		});
	}
}

export default new PostDB();
