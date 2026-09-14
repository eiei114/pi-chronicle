# Dogfood review: `/chronicle:export` snapshot (DOT-1839)

Review date: 2026-09-14

## Scenario

Mid-session checkpoint during pi-chronicle maintenance:

```text
/chronicle:mark    → "CI 緑"
/chronicle:beat    → milestone / "auto-release.yml 動作確認"
/chronicle:export  → Progress/chronicle-20260605-1430.md
/chronicle:mark    → "Trusted Publishing 解決"
/chronicle:end     → overwrites same file with closing note
```

Fixture: `tests/fixtures/dogfood-export-checkpoint.md`

## Did export reduce manual copy/paste?

**Yes.** Export writes vault-ready Markdown under `Progress/` with the same structure as `/chronicle:end`, so maintainers can open Obsidian (or any vault browser) without copying marks/beats by hand. The deterministic filename from session start time also removes naming decisions mid-session.

## Friction found

| Issue | Severity | Resolution in DOT-1839 |
|---|---|---|
| `ended:` reads like session finish on export snapshots | Medium | Documented in `chronicle-format.md` and `examples.md` |
| Empty session export wrote blank chronicle files | Low | Added empty-session guard (aligned with distill/novel) |
| Re-export warning did not explain export→end workflow | Low | Clarified `SNAPSHOT_ALREADY_EXISTS` message |
| No direct tests for shared output helper or end overwrite | Low | Added `chronicle-output.test.mjs` and `end-command.test.mjs` |

## Out of scope (follow-ups)

- Re-export or append checkpoints without ending session
- Rename `ended:` to `snapshot:` for export-only renders
- ROADMAP feature bullet for export (tracked separately)
