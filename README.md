# Pi Chronicle

[![Join dotfield.xyz on Discord](https://img.shields.io/badge/Join%20dotfield.xyz%20on%20Discord-5865F2?logo=discord&logoColor=white)](https://discord.gg/4945dXZVW5)

[![CI](https://github.com/eiei114/pi-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/eiei114/pi-chronicle/actions/workflows/ci.yml)
[![Publish](https://github.com/eiei114/pi-chronicle/actions/workflows/publish.yml/badge.svg)](https://github.com/eiei114/pi-chronicle/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/pi-chronicle.svg)](https://www.npmjs.com/package/pi-chronicle)
[![npm downloads](https://img.shields.io/npm/dm/pi-chronicle.svg)](https://www.npmjs.com/package/pi-chronicle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pi package](https://img.shields.io/badge/pi-package-purple.svg)](https://pi.dev/packages)
[![Trusted Publishing](https://img.shields.io/badge/npm-Trusted%20Publishing-blue.svg)](docs/release.md)
<a href="https://buymeacoffee.com/ekawano114m"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="217" height="60"></a>

> Record conscious markers and typed beats during work sessions, then write chronicle markdown or hand off follow-up artifact prompts from your vault context.

## What this is

A Pi extension that captures **intentional session logs** — not automated transcripts. Mark decisions, blockers, milestones, tries, and reverts as you work, then finalize a single chronicle markdown file into your vault's `Progress/` folder.

For developers and creators who want a lightweight record of *why* they did things in that order — raw material for flow docs, blog posts, or retrospectives.

## Features

- **Auto-start** — session begins when Pi loads; no explicit start command
- **7 colon-flat commands** — no arguments, no flags; prompted after invocation
- **5 beat types** — `decision`, `blocker`, `milestone`, `try`, `revert`
- **Project detection** — auto-resolves output folder from current working directory
- **Vault output** — writes `chronicle-YYYYMMDD-HHmm.md` to your project's `Progress/` folder
- **Novel generation** — `/chronicle:novel` sends a follow-up prompt from session marks/beats; Pi writes `novel-YYYYMMDD-HHmm.md` to the project root
- **Distill handoff** — `/chronicle:distill` turns marks/beats into a follow-up Markdown artifact prompt for `flow`, `textbook`, `essay`, or `fiction`

## Install

Install the published npm package with Pi:

```bash
pi install npm:pi-chronicle
```

Pin a specific version when you want reproducible installs:

```bash
pi install npm:pi-chronicle@0.2.0
```

Install into the current project instead of your user Pi settings:

```bash
pi install npm:pi-chronicle -l
```

Or install from GitHub:

```bash
pi install git:github.com/eiei114/pi-chronicle
```

Try it without permanently installing:

```bash
pi -e npm:pi-chronicle
```

## Quick start

Try this package locally from a clone:

```bash
pi -e .
```

Then run:

```txt
/chronicle:mark    → enter a short label
/chronicle:beat    → pick type → enter label
/chronicle:export  → writes a mid-session snapshot without ending
/chronicle:end     → optional closing note → writes chronicle md
/chronicle:status  → show current session
/chronicle:distill → pick output format → hands off Progress/ artifact prompt
/chronicle:novel   → sends follow-up prompt → Pi writes novel-YYYYMMDD-HHmm.md to project root
```

Session auto-starts when Pi loads — just mark and beat as you work.

Project detection and outside-vault fallback paths are documented in [`docs/examples.md`](docs/examples.md#project-output-locations).

## Export snapshot

`/chronicle:export` writes the current session to `Progress/chronicle-YYYYMMDD-HHmm.md` without ending the session. It uses the same markdown format as `/chronicle:end`, but refuses to overwrite an existing file (fail closed). Use export for mid-session checkpoints; use end to finalize with an optional closing note and overwrite the same deterministic filename.

See [`docs/chronicle-format.md`](docs/chronicle-format.md) for format details and overwrite rules.

## Distill follow-up artifacts

`/chronicle:distill` does not call an LLM directly or synchronously write a file. It renders a bounded follow-up prompt from the active session and sends it through Pi, recommending an output file under the project's `Progress/` folder:

```text
Progress/chronicle-distill-<format>-YYYYMMDD-HHmm.md
```

Choose the format by use case:

- `flow` — chronological work flow, decisions, blockers, reverts, milestones, and next action
- `textbook` — learner-facing explanation with background, steps, cautions, and terms
- `essay` — reflective prose about what changed, why, and what was learned
- `fiction` — short narrative entrypoint aligned with `/chronicle:novel`, but reached from the format chooser

The prompt includes the session name, project key, start time, mark/beat counts, and chronological mark/beat labels. No active session or an empty session produces a warning instead; cancelling the selector is a no-op.

## Novel follow-up

`/chronicle:novel` does not call an LLM directly or synchronously write a file. It renders a bounded follow-up prompt from the active session and sends it through Pi, asking the follow-up agent to write one Markdown file in the project root:

```text
novel-YYYYMMDD-HHmm.md
```

The prompt includes the session chronicle text rendered from marks and beats. No active session or a session with no marks or beats yet produces a warning instead — sessions auto-start when Pi loads, so an empty session usually means you have not recorded any marks or beats yet.

## Package contents

| Path | Purpose |
|---|---|
| `extensions/` | Pi TypeScript extension entrypoints |
| `lib/` | Shared session and output logic |
| `docs/` | Supporting docs (`examples.md`, `release.md`, `template-checklist.md`) |

## Development

```bash
npm install
npm run ci
npm pack --dry-run
```

`npm run ci` runs typecheck, tests, and `npm run pack:check` (equivalent to `npm pack --dry-run`).

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
