# Roadmap

This roadmap is the maintenance-planning source for Pi Chronicle. It favors small, reviewable work items that can be promoted into weekly maintenance seeds.

## Current release status

- Latest release: **v0.2.0** (package version `0.2.0`, npm `latest` is `0.2.0`, tagged on `main`).
- Baseline: **v0.1.0** shipped the first public chronicle flow — auto-started sessions, `/chronicle:mark`, `/chronicle:beat`, `/chronicle:end`, `/chronicle:status`, `/chronicle:novel`, project detection, and footer status.
- **v0.2.0** shipped `/chronicle:distill` as a follow-up Markdown artifact handoff for `flow`, `textbook`, `essay`, and `fiction`, with shared prompt rendering between distill and novel.
- Recent shipped maintenance: README/release doc sync to npm `0.2.0` (PR #42), `/chronicle:novel` follow-up documentation (PR #43), CHANGELOG drift repair and regression checks (PR #40).
- Current development target: **v0.2.x maintenance** — keep the capture, distill, and novel handoff flows stable while dependency health and docs stay current.
- Next feature line: **v0.3.0 polish** — session ergonomics, clearer status messaging, and richer examples for non-vault layouts.
- Open repository PRs at roadmap refresh: Dependabot dev-dependency bump for Pi packages and Node types (#39). No open GitHub issues were present.

## Short-term maintenance priorities (next 1–2 releases)

### v0.2.x maintenance line

Goal: keep the released capture-and-handoff workflow dependable.

- Merge or triage the remaining Dependabot dev-dependency PR in small, CI-validated batches.
- Keep README, `docs/release.md`, and `CHANGELOG.md` synchronized with npm `latest` (guarded by `tests/docs-sync.test.mjs`).
- Avoid bundling dependency updates with behavior changes.

### v0.3.0 polish line

Goal: improve day-to-day ergonomics after distill and novel handoffs are stable.

- Clarify footer/status messaging for empty sessions, saved paths, and follow-up prompt dispatch.
- Add examples that cover outside-vault fallback behavior and manual project keys.
- Consider optional session recovery or export helpers if users need persistence beyond one Pi process.

## Known technical debt and improvement areas

- `tests/smoke.test.mjs` and `tests/project.test.mjs` overlap on project detection coverage; consolidating them would reduce drift risk.
- Footer/status messaging for empty sessions and follow-up handoffs could be clearer in the UI layer.
- `docs/template-checklist.md` is still template-bootstrap oriented; mature-repo maintainers may prefer a trimmed maintainer note or merge into `docs/release.md`.
- Dependabot PR #39 remains open and should be reviewed rather than left to age.
- `ROADMAP.md` is not included in the npm tarball (`package.json` `files`); that is intentional for now but worth revisiting if roadmap context should ship with the package.

## Candidate maintenance seeds

Each candidate below is intended to fit a **30–90 minute** maintenance window.

### Seed 1: Triage Dependabot dev-dependency PR #39

- **Scope:** 30–60 minutes.
- **What:** Review and merge or close the open dev-dependency bump for Pi packages and Node types.
- **Why:** Stale dependency PRs accumulate toolchain drift and make later release work harder to reason about.
- **Acceptance criteria:**
  - `npm run ci` passes on the updated branch.
  - Incompatible updates are left open with a clear blocker comment or converted into a follow-up issue.
  - `package-lock.json` stays consistent with `package.json`.

### Seed 2: Consolidate overlapping project-detection tests

- **Scope:** 45–75 minutes.
- **What:** Merge `tests/smoke.test.mjs` project cases into `tests/project.test.mjs` (or vice versa) and remove duplicate coverage.
- **Why:** Two suites exercise similar `detectProject` paths; one focused suite is easier to extend when vault layout rules change.
- **Acceptance criteria:**
  - No loss of coverage for `4_Project` paths, outside-vault behavior, manual fallback keys, or vault-root discovery.
  - `npm run ci` passes.
  - No user-facing behavior changes.

### Seed 3: Document outside-vault fallback behavior

- **Scope:** 30–60 minutes.
- **What:** Add a short section to `docs/examples.md` (and a README cross-link if needed) showing manual project key entry and `scratch` fallback when cwd is outside a vault.
- **Why:** Project detection works outside `4_Project`, but users may not discover the fallback path without an explicit example.
- **Acceptance criteria:**
  - Examples describe detected vs manual vs scratch output locations.
  - Docs remain consistent with the auto-start session model.
  - No code changes required.

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
