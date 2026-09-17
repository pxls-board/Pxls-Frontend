<div align="center">

![Pxls](https://i.imgur.com/udeloqX.png)

![CI](https://img.shields.io/github/actions/workflow/status/pxlsspace/pxls-web/ci.yml?style=flat-square)
[![GitHub issues](https://img.shields.io/github/issues/pxlsspace/pxls-web?style=flat-square)](https://github.com/pxlsspace/pxls-web/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/pxlsspace/pxls-web?style=flat-square)](https://github.com/pxlsspace/pxls-web/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/pxlsspace/pxls-web?style=flat-square)](https://github.com/pxlsspace/pxls-web/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/pxlsspace/pxls-web?style=flat-square)](https://github.com/pxlsspace/pxls-web/stargazers)

</div>

Pxls is a collaborative canvas where users can place one pixel from a limited palette at a time, inspired by Reddit's [r/Place][place] experiment.

This repository holds the front end web client. The back end can be found [here][backend].

It's a [Nuxt](https://nuxt.com) app (client-side rendered) built with [Nuxt UI](https://ui.nuxt.com), Tailwind CSS and TypeScript. Its server proxies every request it doesn't handle itself, including the `/ws` WebSocket, to the back end.

# Installation

Automatically built files are available as artifacts on each push [here][actions].

## Requirements

- [Node.js](https://nodejs.org/en/) 22.18 or newer
- [pnpm](https://pnpm.io)

Install dependencies with `pnpm install`.

## Development

Copy `.env.example` to `.env` and point `NUXT_PROXY_TO` at a running back end, then run `pnpm dev`.

| Command          | Description                               |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Development server with hot reload        |
| `pnpm build`     | Production build into `.output/`          |
| `pnpm start`     | Run the production build                  |
| `pnpm lint`      | oxlint, then ESLint for Vue templates     |
| `pnpm fmt`       | Format with oxfmt (`fmt:check` to verify) |
| `pnpm typecheck` | Type-check with vue-tsc                   |

## Running

Build with `pnpm build`, then run `node .output/server/index.mjs` (or `pnpm start`) with these environment variables:

- `NUXT_PROXY_TO`: back end host and port, e.g. `localhost:4567`
- `NUXT_PUBLIC_TITLE`: title shown on each page
- `PORT` / `HOST`: where to listen (default `3000`)

If you put a reverse proxy in front, make sure it forwards WebSocket upgrades for `/ws`.

## Translations

Translations live in `po/` as gettext files.

- `pnpm gen-pot` extracts strings from the source into `po/Localization.pot`.
- `pnpm update-local` merges the template into every `po/Localization_<code>.po` (needs gettext).
- `pnpm new-local <code>` creates a new language (then add it to `i18n/locales.ts` and `i18n/locales/`).

## Userscripts

See [docs/userscript-api.md](docs/userscript-api.md) for the `window.pxls` API.

# Licenses

- Emoji graphics by [Twemoji](https://github.com/jdecked/twemoji) (CC-BY 4.0).
- Icons from [Material Symbols](https://fonts.google.com/icons) (Apache 2.0).

[place]: https://reddit.com/r/place/
[backend]: https://github.com/pxlsspace/Pxls/
[actions]: https://github.com/pxlsspace/pxls-web/actions/workflows/ci.yml
