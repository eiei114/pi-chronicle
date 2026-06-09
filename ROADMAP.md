# Roadmap

This roadmap is the maintenance-planning source for Pi Chronicle. It favors small, reviewable work items that can be promoted into weekly maintenance seeds.

## Current release status

- Latest release: **v0.1.1** (package version `0.1.1`, tagged on `main`).
- Baseline: **v0.1.0** shipped the first public chronicle flow: auto-started sessions, `/chronicle:mark`, `/chronicle:beat`, `/chronicle:end`, `/chronicle:status`, the v0.2.0 `/chronicle:distill` stub, `/chronicle:novel`, project detection, and footer status.
- Most recent shipped change: PR #6 / DOT-187 removed stale `/chronicle:start` references and aligned examples with the auto-start flow.
- Current development target: **v0.2.0**, centered on turning `/chronicle:distill` from a stub into useful generated summaries while keeping the v0.1.x capture flow stable.
- Open repository PRs at roadmap creation: Dependabot dev-dependency bumps for Pi packages, TypeBox, and Node types (#1-#5). No open GitHub issues were present.

## Release themes

### v0.1.x maintenance line

Goal: keep the released capture-and-save workflow dependable.

- Keep documentation synchronized with the auto-start session model.
- Maintain dependency health without bundling unrelated behavior changes.
- Improve confidence around project detection and markdown rendering with focused tests.

### v0.2.0 distill line

Goal: make `/chronicle:distill` produce useful artifacts from a session.

- Define the output contract for `flow`, `textbook`, `essay`, and `fiction` distill formats.
- Reuse the existing session-to-prompt logic where possible instead of adding parallel formatting paths.
- Decide where generated distill files should be written and how filenames are derived.

### v0.3.0 polish line

Goal: improve day-to-day ergonomics after distill is usable.

- Improve status/notification clarity for empty sessions, saved paths, and generated follow-up prompts.
- Add examples that cover common vault layouts and fallback behavior outside a vault.
- Consider optional session recovery or export helpers if users need persistence beyond one Pi process.

## Known technical debt and improvement areas

- `tests/smoke.test.mjs` re-implements project detection instead of importing the TypeScript source, so tests can drift from production logic.
- Markdown rendering for `/chronicle:end` is not covered directly by tests.
- `/chronicle:distill` is currently a selection stub and does not yet create prompts or files.
- `/chronicle:novel` builds a prompt but relies on the follow-up agent to write the named output file; docs should make that handoff explicit.
- Release/template docs still include setup-oriented material that may be more useful to maintainers than end users.
- Dependency update PRs are open and should be reviewed in small batches to avoid toolchain churn.

## Candidate maintenance seeds

Each candidate below is intended to fit a **30-90 minute** maintenance window.

### Seed 1: Add direct tests for `detectProject` and `resolveProject`

- **Scope:** 45-75 minutes.
- **What:** Replace or supplement the local test re-implementation in `tests/smoke.test.mjs` with tests that exercise exported logic from `lib/project.ts`.
- **Why:** The current smoke test can pass even if production project detection changes or regresses.
- **Acceptance criteria:**
  - Tests cover detected `4_Project/<project>` paths, fallback `scratch`, manual fallback keys, and vault-root discovery behavior.
  - `npm run ci` passes.
  - No user-facing behavior changes.

### Seed 2: Add unit coverage for chronicle markdown rendering

- **Scope:** 45-90 minutes.
- **What:** Expose or refactor the `/chronicle:end` markdown rendering path so it can be tested without invoking Pi UI APIs.
- **Why:** The saved `chronicle-YYYYMMDD-HHmm.md` file is the core artifact of the package, but formatting regressions are currently easy to miss.
- **Acceptance criteria:**
  - Tests verify headings, started/ended timestamps, marks, beats, optional closing notes, and empty sections.
  - The command behavior remains unchanged.
  - `npm run ci` passes.

### Seed 3: Document `/chronicle:novel` follow-up behavior

- **Scope:** 30-60 minutes.
- **What:** Update `README.md` and `docs/examples.md` to clarify that `/chronicle:novel` sends a follow-up prompt asking Pi to write `novel-YYYYMMDD-HHmm.md` in the project root.
- **Why:** Users may expect the command itself to synchronously write the file, while the implementation delegates generation to the agent follow-up.
- **Acceptance criteria:**
  - Quick start or examples include a concise novel-generation note.
  - The docs describe the empty-session guard.
  - Documentation remains consistent with the auto-start flow.

### Seed 4: Triage Dependabot dev-dependency PRs

- **Scope:** 30-90 minutes per small batch.
- **What:** Review and merge or close the open dev-dependency bumps for Pi packages, TypeBox, and Node types.
- **Why:** Keeping the Pi peer/dev toolchain fresh reduces later release friction, but these updates should be validated rather than merged blindly.
- **Acceptance criteria:**
  - Each PR or batch records the tested command(s), preferably `npm run ci`.
  - Incompatible updates are left open with a clear blocker comment or converted into a follow-up issue.
  - `package-lock.json` stays consistent with `package.json`.

### Seed 5: Define the v0.2.0 distill output contract

- **Scope:** 60-90 minutes.
- **What:** Add a short design note or README section describing what each distill format should produce, where it should be written, and the expected filename pattern.
- **Why:** `/chronicle:distill` already exposes format choices, but implementation work needs a stable contract before code is added.
- **Acceptance criteria:**
  - The four current formats (`flow`, `textbook`, `essay`, `fiction`) have one-paragraph intended outputs.
  - The note states whether distill generation writes files directly or uses a follow-up prompt.
  - Follow-up implementation can be scoped from the documented contract.

### Seed 6: Clean up template-oriented maintainer docs

- **Scope:** 30-60 minutes.
- **What:** Review `docs/template-checklist.md` and decide whether to keep it as maintainer-only documentation, trim it, or move useful release checklist items into `docs/release.md`.
- **Why:** Template setup material can distract from package usage and maintenance docs after the initial release.
- **Acceptance criteria:**
  - Maintainer docs have a clear purpose and no stale first-release checklist items.
  - Public README links remain accurate.
  - No code changes are required.

## Notes for future seed planners

- Prefer one bounded seed per PR.
- Avoid combining dependency updates with behavior changes.
- For code seeds, include `npm run ci` in the expected verification unless the task is documentation-only.
