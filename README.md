# Pi Chronicle

[![CI](https://github.com/eiei114/pi-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/eiei114/pi-chronicle/actions/workflows/ci.yml)
[![Publish](https://github.com/eiei114/pi-chronicle/actions/workflows/publish.yml/badge.svg)](https://github.com/eiei114/pi-chronicle/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/pi-chronicle.svg)](https://www.npmjs.com/package/pi-chronicle)
[![npm downloads](https://img.shields.io/npm/dm/pi-chronicle.svg)](https://www.npmjs.com/package/pi-chronicle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pi package](https://img.shields.io/badge/pi-package-purple.svg)](https://pi.dev/packages)
[![Trusted Publishing](https://img.shields.io/badge/npm-Trusted%20Publishing-blue.svg)](docs/release.md)

> Record conscious markers and typed beats during work sessions, then write chronicle markdown to your vault.

## What this is

A Pi extension that captures **intentional session logs** — not automated transcripts. Mark decisions, blockers, milestones, tries, and reverts as you work, then finalize a single chronicle markdown file into your vault's `Progress/` folder.

For developers and creators who want a lightweight record of *why* they did things in that order — raw material for flow docs, blog posts, or retrospectives.

## Features

- **6 colon-flat commands** — no arguments, no flags; prompted after invocation
- **5 beat types** — `decision`, `blocker`, `milestone`, `try`, `revert`
- **Session-scoped** — starts with `/chronicle:start`, ends with `/chronicle:end`
- **Vault output** — writes `chronicle-YYYYMMDD-HHmm.md` to your project's `Progress/` folder
- **Distill select** — choose a target format (`flow`, `textbook`, `essay`, `fiction`) for future generation

## Install

```bash
pi install npm:pi-chronicle
```

Or try without permanent install:

```bash
pi -e npm:pi-chronicle
```

## Quick start

```txt
/chronicle:start   → enter session name
/chronicle:mark    → enter a short label
/chronicle:beat    → pick type → enter label
/chronicle:end     → optional closing note → writes chronicle md
/chronicle:status  → show current session
/chronicle:distill → pick output format
```

No arguments needed. All input is collected via interactive prompts after command execution.

## Package contents

| Path | Purpose |
|---|---|
| `extensions/` | Pi TypeScript extension entrypoints |
| `lib/` | Shared session and output logic |
| `skills/` | Agent Skills |
| `docs/` | Optional supporting docs |

## Development

```bash
npm install
npm run ci
```

## Release

npm Trusted Publishing — no `NPM_TOKEN` required.

```bash
npm version patch
git push
```

See [`docs/release.md`](docs/release.md) for setup details.

## Security

Pi packages can execute code with your local permissions. Review extensions before installing third-party packages.

For vulnerability reporting, see [`SECURITY.md`](SECURITY.md).

## Links

- npm: https://www.npmjs.com/package/pi-chronicle
- GitHub: https://github.com/eiei114/pi-chronicle
- Issues: https://github.com/eiei114/pi-chronicle/issues

## License

MIT
