<div align="center">

# JustLearnIT

**Free educational resources on programming, technology, and digital skills.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/JustLearnITx/JustLearnITPage.svg)](https://github.com/JustLearnITx/JustLearnITPage/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/JustLearnITx/JustLearnITPage.svg)](https://github.com/JustLearnITx/JustLearnITPage/issues)
[![Built with Express](https://img.shields.io/badge/Built%20with-Express-000000.svg?logo=express&logoColor=white)](https://expressjs.com)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ff69b4.svg?logo=github&logoColor=white)](https://github.com/sponsors/oheyek)

---

</div>

A web platform that collects and presents educational materials so anyone can find what they want to learn.

The site is available exclusively at **https://justlearnit.cc** — the only official link.

## Features

- Server-rendered course and post pages with canonical, Open Graph, Twitter Card and JSON-LD metadata
- SQLite-backed courses and posts, exposed through a small JSON API
- Admin forms for creating courses and posts
- Dynamic `/sitemap.xml` and `/rss.xml` feeds
- Cache-busted static assets built with an automated pipeline
- Security headers, bearer-token admin writes, request validation and rate limiting
- API documentation generated with Doxygen

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Runtime     | Node.js 24+, Express                            |
| Database    | SQLite                                          |
| Frontend    | HTML, CSS, JavaScript (vanilla)                 |
| Build       | Custom Node.js pipeline (Tailwind, Terser, Lightning CSS) |
| Docs        | Doxygen + doxygen-awesome theme                 |

## Getting Started

Requires Node.js 24+ and npm.

```sh
npm install
cp .env.example .env

# Set TOKEN to at least 32 random characters, for example:
# openssl rand -hex 32

chmod 600 .env
npm run build
node server.js
```

The server listens on `SERVER_PORT` from `.env` (the example uses `3000`). Open `http://localhost:3000`.

### Configuration

| Variable                    | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `SERVER_PORT`               | HTTP port the Express server listens on                            |
| `DB_PATH`                   | Path to the SQLite database file                                   |
| `TOKEN`                     | Bearer token required for admin writes; use 32+ random characters  |
| `STATIC_FILES_DIR`          | Directory containing built assets (`dist`)                         |
| `STATIC_CACHE_MAX_AGE`      | Static asset cache lifetime; hashed JS/CSS is cached for one year  |
| `POSTS_LIST_CACHE_MAX_AGE`  | Cache lifetime in seconds for list APIs, the sitemap and RSS       |
| `POST_DETAIL_CACHE_MAX_AGE` | Cache lifetime in seconds for course and post detail APIs          |
| `DOMAIN`                    | Canonical domain; when unset, the request host is used             |
| `GOOGLE_SITE_VERIFICATION`  | Optional Google Search Console verification value                  |

## Database

The app expects an existing SQLite database at `DB_PATH`. The bundled `db/database.db` contains local development data, so replace it with a backed-up production database before deploying.

There is no automatic migration or initialisation step. Keep production database files out of version control and take a backup before upgrades.

## Admin

| Page             | Purpose       |
| ---------------- | ------------- |
| `/admin`         | Create a post |
| `/admin-courses` | Create a course |

Both pages ask for the `TOKEN` value. Admin writes also require an `Authorization: Bearer <TOKEN>` header when using the API directly. Admin pages are marked `noindex`.

## API

| Method | Path                  | Description                         |
| ------ | --------------------- | ----------------------------------- |
| `GET`  | `/api/courses`        | All courses                         |
| `GET`  | `/api/courses/:slug`  | A course and its public posts       |
| `GET`  | `/api/posts`          | All public posts                    |
| `GET`  | `/api/posts/:slug`    | A single public post                |
| `GET`  | `/api/stats`          | Course and post counts              |
| `POST` | `/api/courses`        | Create a course (token required)    |
| `POST` | `/api/posts`          | Create a post (token required)      |

Example:

```sh
curl -X POST "http://localhost:3000/api/courses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"example","title":"Example","shortDescription":"An example course."}'
```

Writes are limited to 10 requests per minute per IP; other API requests are limited to 120 per minute. The limits are in-memory and apply per server process.

## Deployment

Local container:

```sh
docker compose -f docker-compose-local.yml up --build
```

Production uses Caddy for TLS and the reverse proxy:

```sh
docker compose up -d --build
```

Set `DOMAIN` in `.env`, point its DNS at the host, expose ports `80` and `443`, and keep the backed-up SQLite database in `db/` so the compose volume can mount it. The app container runs as a non-root user and includes a healthcheck.

## Documentation

Live docs: **https://justlearnitx.github.io/JustLearnITPage/**

Requires the installed deps from `npm install` (the theme loads from `node_modules`).

```sh
doxygen Doxyfile
```

Output is written to `docs/html/`.

## Project Structure

```
├── build.js                  # Asset minification & hashing pipeline
├── server.js                 # Express application entry point
├── src/                      # Server-side database and helper modules
├── public/                   # Unprocessed source assets and admin pages
├── db/                       # SQLite database and SQL scripts
├── dist/                     # Built assets (generated, gitignored)
├── doxygen/                  # Doxygen theme overrides
├── docs/                     # Generated documentation (gitignored)
├── Dockerfile
├── docker-compose.yml        # Production app + Caddy
├── docker-compose-local.yml  # Local app container
└── Caddyfile
```

## Support

If you find this project useful, consider [sponsoring on GitHub](https://github.com/sponsors/oheyek).

## License

Distributed under the [MIT License](LICENSE). Built with the [doxygen-awesome-css](https://github.com/jothepro/doxygen-awesome-css) theme.
