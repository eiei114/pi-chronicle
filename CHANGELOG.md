# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

## Unreleased

### Changed

- Clarify empty-session user messaging with actionable `/chronicle:mark` and `/chronicle:beat` hints, centralize no-active-session guards across mark/beat/end, and show empty vs entry-count footer status.
- Dogfood review for `/chronicle:export`: warn on empty sessions, clarify snapshot `ended:` semantics and export→end workflow in docs, and improve re-export guidance.
- Add dogfood fixture coverage, `writeChronicleSnapshot` unit tests, and `/chronicle:end` command tests.

## [0.3.0] - 2026-09-13

### Added

- Add `/chronicle:export` to write a mid-session chronicle snapshot without ending the active session.
- Add shared chronicle output helpers and document export vs end overwrite rules in `docs/chronicle-format.md`.
- Add export command tests for happy path, missing session, and overwrite refusal.

## [0.2.0] - 2026-08-25

### Added

- Turn `/chronicle:distill` into a follow-up Markdown artifact handoff with `flow`, `textbook`, `essay`, and `fiction` prompt contracts.
- Add focused command coverage for distill no-active-session, empty-session, cancel, and all format selection paths.

### Changed

- Share chronicle prompt rendering between `/chronicle:distill` and `/chronicle:novel` while preserving novel output naming and follow-up behavior.
- Bump package version metadata to `0.2.0` for the distill follow-up feature.

## [0.1.6] - 2026-08-22

### Changed

- Merge the 2026-08-22 managed OSS dependency and maintenance PR batch.
- Extract `renderChronicle` for unit coverage.
- Speed up CI dependency checks and consolidate Dependabot updates across ecosystems.
- Sync release recovery documentation with npm `latest` `0.1.5`.

## [0.1.5] - 2026-08-03

### Added

- Add dotfield.xyz Discord community badge to README.

### Changed

- Sync README pinned install example with `package.json` version.
- Expand project resolution and outside-vault fixture test coverage.
- Bump GitHub Actions `setup-node` to v7 and `@types/node` to 26.

## [0.1.4] - 2026-07-20

### Changed

- Bump `pi-coding-agent` and `pi-ai` peer dependencies to `^0.80.6`.
- Import `detectProject` from `lib/project.ts` in smoke tests.
- Document investigation of failed npm publish run 28700780370.

## [0.1.3] - 2026-07-04

### Fixed

- Resolve npm publish `E404` by removing `registry-url` from `setup-node` (DOT-493).
- Make auto-release `workflow_dispatch` the authoritative npm publish path (DOT-494).

### Added

- Add release sync guardrail script and registry drift recovery documentation (DOT-495).
- Add Buy Me a Coffee sponsor button and GitHub funding link.

## [0.1.2] - 2026-06-27

### Changed

- Align README install guidance with the current Pi OSS template (npm, GitHub, project-local, and `pi -e .` paths)
- Document `npm pack --dry-run` in Development and reflect actual shipped package contents
- Remove unused `skills/`, `prompts/`, and `themes/` entries from `package.json`

## [0.1.1] - 2026-06-05

### Changed

- Remove stale `/chronicle:start` references from command notifications and examples
- Align docs with auto-start session flow on Pi `session_start`

## [0.1.0] - 2026-06-05

### Added

- Auto-start session on Pi load via `session_start` event
- `/chronicle:mark` — add a timestamped mark label
- `/chronicle:beat` — add a typed beat (decision / blocker / milestone / try / revert)
- `/chronicle:end` — finalize session and write `chronicle-YYYYMMDD-HHmm.md` to vault `Progress/`
- `/chronicle:status` — show current session info
- `/chronicle:distill` — stub select for future v0.2.0 distill generation
- `/chronicle:novel` — generate a short novel from session records via Pi agent, write to project root
- Project auto-detection from `ctx.cwd` (walks up to find `4_Project/<project>/`)
- Fallback to manual project name input when outside vault
- Footer status indicator showing active project
