# Roadmap

This roadmap is the maintenance-planning source for Pi Chronicle. It favors small, reviewable work items that can be promoted into weekly maintenance seeds.

## Current release status

- Repository package version at this refresh: **v0.3.6** (`package.json`; changelog entry dated 2026-09-30).
- Baseline: **v0.1.0** shipped the first public chronicle flow — auto-started sessions, `/chronicle:mark`, `/chronicle:beat`, `/chronicle:end`, `/chronicle:status`, `/chronicle:novel`, project detection, and footer status.
- **v0.2.0** shipped `/chronicle:distill` as a follow-up Markdown artifact handoff for `flow`, `textbook`, `essay`, and `fiction`, with shared prompt rendering between distill and novel.
- **v0.3.0** shipped `/chronicle:export` for mid-session snapshots; subsequent patch releases kept the package and Pi SDK dependencies current through `v0.3.6`.
- Recent repository maintenance: Pi SDK dependency sync to `0.99.1` (v0.3.6), chronicle markdown contract documentation, export/dogfood coverage, and release documentation updates.
- Current development target: **v0.3.x maintenance** — keep capture, export, distill, and novel handoff flows stable while release metadata and dependencies stay current.
- Next feature line: **v0.4.0 polish** — session ergonomics, clearer status messaging, and richer examples for non-vault layouts.
- Publication status should be confirmed separately before release work; this roadmap records repository state and does not assume that `package.json` is the npm `latest` version.

## Short-term maintenance priorities (next 1–2 releases)

### v0.3.x maintenance line

Goal: keep the released capture-and-handoff workflow dependable.

- Review Pi SDK and type dependency health in small, CI-validated batches.
- Keep README, `docs/release.md`, and `CHANGELOG.md` synchronized with npm `latest` (guarded by `tests/docs-sync.test.mjs`).
- Avoid bundling dependency updates with behavior changes.

### v0.4.0 polish line

Goal: improve day-to-day ergonomics after distill and novel handoffs are stable.

- Clarify footer/status messaging for empty sessions, saved paths, and follow-up prompt dispatch.
- Add examples that cover outside-vault fallback behavior and manual project keys.
- Consider optional session recovery or export helpers if users need persistence beyond one Pi process.

## Known technical debt and improvement areas

- `tests/docs-sync.test.mjs` still hard-codes the published version (`0.2.0`), while repository metadata is now at `0.3.6`; release docs and the README pin example have the same drift.
- Footer/status messaging for empty sessions and follow-up handoffs could be clearer in the UI layer; the unreleased changelog notes partial progress here.
- `docs/template-checklist.md` is still template-bootstrap oriented; mature-repo maintainers may prefer a trimmed maintainer note or merge into `docs/release.md`.
- Dependency updates should remain separate from behavior changes and continue to run through the full CI/typecheck path.
- `ROADMAP.md` is not included in the npm tarball (`package.json` `files`); that is intentional for now but worth revisiting if roadmap context should ship with the package.

## Candidate maintenance seeds

Each candidate below is intended to fit a **30–90 minute** maintenance window.

### Seed 1: Repair release metadata drift for v0.3.6

- **Scope:** 30–60 minutes.
- **What:** Synchronize the README pinned install example, `docs/release.md`, and `tests/docs-sync.test.mjs` with the repository's current release metadata; verify npm `latest` before stating publication status.
- **Why:** The current docs and guard test still point at `0.2.0`, which can mislead users and conceal future release drift.
- **Acceptance criteria:**
  - User-facing release references consistently describe the verified current version.
  - `tests/docs-sync.test.mjs` derives or validates the intended release source without a stale hard-coded target.
  - `npm run ci` passes.

### Seed 2: Review dependency and Pi SDK maintenance health

- **Scope:** 30–60 minutes.
- **What:** Review the current Pi SDK/type dependency set and lockfile after the `0.99.1` update; identify only one small, CI-validated follow-up if needed.
- **Why:** Keeping the extension aligned with the Pi SDK reduces compatibility surprises without mixing dependency work into feature changes.
- **Acceptance criteria:**
  - Any update is isolated and justified by compatibility or security evidence.
  - `package-lock.json` stays consistent with `package.json`.
  - `npm run ci` passes.

### Seed 3: Consolidate project-detection test coverage

- **Scope:** 45–75 minutes.
- **What:** Inspect the existing project-detection suites and consolidate genuinely overlapping cases without removing coverage for outside-vault and manual fallback behavior.
- **Why:** A focused suite is easier to extend when vault layout rules change.
- **Acceptance criteria:**
  - Coverage remains for `4_Project` paths, outside-vault behavior, manual fallback keys, and vault-root discovery.
  - `npm run ci` passes.
  - No user-facing behavior changes.

### Seed 4: Improve empty-session status messaging

- **Scope:** 60–90 minutes.
- **What:** Audit `/chronicle:status`, `/chronicle:distill`, and `/chronicle:novel` warning paths and make empty-session guards more explicit in notifications.
- **Why:** Sessions auto-start on Pi load, so an "empty" session is common; clearer messaging reduces confusion about why distill/novel did not send a follow-up.
- **Acceptance criteria:**
  - Warnings distinguish "no active session" from "session has no marks or beats yet".
  - Existing follow-up command tests still pass or are updated to match improved copy.
  - `npm run ci` passes.

### Seed 5: Trim template-oriented maintainer docs

- **Scope:** 30–60 minutes.
- **What:** Review `docs/template-checklist.md` and either trim first-release checklist items, mark it maintainer-only in README, or move useful release checklist fragments into `docs/release.md`.
- **Why:** Template setup material can distract from package usage docs after the initial release.
- **Acceptance criteria:**
  - Maintainer docs have a clear purpose and no stale first-release placeholders.
  - Public README links remain accurate.
  - No code changes required.

### Seed 6: Add ROADMAP freshness guard to docs-sync tests

- **Scope:** 30–45 minutes.
- **What:** Extend `tests/docs-sync.test.mjs` with a lightweight assertion that `ROADMAP.md` references the current `package.json` version in its release status section.
- **Why:** Stale roadmap context blocks weekly maintenance seed planners; a small regression test prevents silent drift after releases.
- **Acceptance criteria:**
  - Test fails when ROADMAP release status and `package.json` version diverge.
  - `npm run ci` passes with the refreshed ROADMAP.

## Notes for future seed planners

- Prefer one bounded seed per PR.
- Avoid combining dependency updates with behavior changes.
- For code seeds, include `npm run ci` in the expected verification unless the task is documentation-only.
- Refresh this file after each npm release so release status and candidate seeds stay actionable.
