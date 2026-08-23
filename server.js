import express from "express";
import sqlite3 from "sqlite3";
import path from "path";

const __dirname = import.meta.dirname;

const app = express();
const db = new sqlite3.Database("./db/database.db", (error) => {
	error ? console.error(`Error: ${error}`) : console.log("Connected to db");
});

app.get("/courses", (req, res) => {
	res.sendFile(path.join(__dirname, "public/pages/courses.html"));
	db.all(
		"SELECT id, slug, header, subheader, is_public, created_at, updated_at FROM posts",
		[],
		(error, rows) => (error ? console.error(error) : console.log(rows)),
	);
});

app.use(express.static("./public"));

app.listen(6969, () => console.log("test"));
