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

- Course index rendered from an SQLite-backed store
- Cache-busted static assets built with an automated pipeline
- API documentation generated with Doxygen

## Tech Stack

| Layer       | Technology                         |
| ----------- | ---------------------------------- |
| Runtime     | Node.js, Express                   |
| Database    | SQLite                             |
| Frontend    | HTML, CSS, JavaScript (vanilla)    |
| Build       | Custom Node.js pipeline            |
| Docs        | Doxygen + doxygen-awesome theme    |

## Getting Started

Requires Node.js and npm.

```sh
npm install
npm run build

cp .env.example .env
node server.js
```

## Documentation

Live docs: **https://justlearnitx.github.io/JustLearnITPage/**

Requires the installed deps from `npm install` (the theme loads from `node_modules`).

```sh
doxygen Doxyfile
```

Output is written to `docs/html/`.

## Project Structure

```
├── build.js          # Asset minification & hashing pipeline
├── server.js         # Express application entry point
├── src/              # Server-side modules
├── public/           # Unprocessed source assets
├── doxygen/          # Doxygen theme overrides
└── docs/             # Generated documentation (gitignored)
```

## Support

If you find this project useful, consider [sponsoring on GitHub](https://github.com/sponsors/oheyek).

## License

Distributed under the [MIT License](LICENSE). Built with the [doxygen-awesome-css](https://github.com/jothepro/doxygen-awesome-css) theme.
