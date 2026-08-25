# Examples

## Quick session workflow

Session auto-starts when Pi loads — no start command needed.

```text
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "milestone" → enter "auto-release.yml 動作確認"
/chronicle:beat    → select "blocker" → enter "npm provenance 設定不明"
/chronicle:mark    → enter "Trusted Publishing 解決"
/chronicle:end     → enter "初回リリース完了" → writes chronicle md
```

## Output file

```markdown
# Chronicle — 2026-06-05
started: 2026-06-05 14:30
ended: 2026-06-05 16:15

## Marks
- 14:45 — CI 緑
- 15:30 — Trusted Publishing 解決

## Beats
### 14:50 · milestone · auto-release.yml 動作確認
### 15:00 · blocker · npm provenance 設定不明

## Closing
初回リリース完了
```

## Distill follow-up artifact

Use `/chronicle:distill` while a session still has marks or beats. Pi Chronicle renders a bounded follow-up prompt; the follow-up agent writes one reusable Markdown artifact under the project's `Progress/` folder.

```text
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "decision" → enter "Trusted Publishing の明示 dispatch を維持"
/chronicle:beat    → select "blocker" → enter "npm provenance 設定確認が未完"
/chronicle:distill → select "flow" → sends a follow-up prompt for Progress/chronicle-distill-flow-20260605-1430.md
```

The follow-up prompt includes the session name, project key, start time, mark count, beat count, and chronological entries such as:

```markdown
### 時系列
- 14:45 — mark — CI 緑
- 14:50 — beat:decision — Trusted Publishing の明示 dispatch を維持
- 15:00 — beat:blocker — npm provenance 設定確認が未完
```

A typical `flow` artifact can then summarize the work flow, decisions, blockers, reverts, milestones, and next action in Markdown.
