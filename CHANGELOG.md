# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

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
