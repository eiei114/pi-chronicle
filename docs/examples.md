# Examples

## Quick session workflow

Session auto-starts when Pi loads — no start command needed.

```text
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "milestone" → enter "auto-release.yml 動作確認"
/chronicle:beat    → select "blocker" → enter "npm provenance 設定不明"
/chronicle:mark    → enter "Trusted Publishing 解決"
/chronicle:export  → writes a mid-session snapshot without closing
/chronicle:end     → enter "初回リリース完了" → writes chronicle md
```

## Export snapshot (mid-session checkpoint)

Use `/chronicle:export` to checkpoint the current session without ending it. The snapshot uses the same `Progress/chronicle-YYYYMMDD-HHmm.md` naming as `/chronicle:end`, but export refuses to overwrite an existing file and leaves the session active.

```text
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "milestone" → enter "auto-release.yml 動作確認"
/chronicle:export  → writes Progress/chronicle-20260605-1430.md (session continues)
/chronicle:mark    → enter "Trusted Publishing 解決"
/chronicle:end     → enter "初回リリース完了" → overwrites the same file and ends session
```

Vault example path:

```text
vault/4_Project/pi-chronicle/Progress/chronicle-20260605-1430.md
```

See [`chronicle-format.md`](chronicle-format.md) for export vs end overwrite rules.

The export snapshot's `ended:` line is the checkpoint write time, not a session finish. The session stays active until `/chronicle:end`.

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

## Novel follow-up

Use `/chronicle:novel` while a session still has marks or beats. Pi Chronicle renders a bounded follow-up prompt; the follow-up agent writes one short-novel Markdown file in the project root.

```text
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "milestone" → enter "auto-release.yml 動作確認"
/chronicle:novel   → sends a follow-up prompt for novel-20260605-1430.md in the project root
```

The follow-up prompt includes the session chronicle text rendered from marks and beats. No active session or an empty session (no marks or beats yet) produces a warning instead — sessions auto-start when Pi loads.

## Project output locations

Sessions auto-start when Pi loads. Pi Chronicle resolves the output project from Pi's current working directory (`ctx.cwd`) and shows the active project key in the footer status (`● <key>`). Use `/chronicle:status` to confirm the resolved project and `Progress/` path before ending a session.

| Situation | Project key | Chronicle output (`/chronicle:end`) |
|---|---|---|
| cwd is under `4_Project/<key>/...` | detected `<key>` | `<vault>/4_Project/<key>/Progress/chronicle-YYYYMMDD-HHmm.md` |
| cwd is inside a vault (`.pi/` or `.obsidian/` ancestor) but not under `4_Project` | `scratch` | `<vault>/4_Project/scratch/Progress/chronicle-YYYYMMDD-HHmm.md` |
| cwd is outside any vault | `scratch` | `<cwd>/Progress/chronicle-YYYYMMDD-HHmm.md` |

Example: clone this repo and run `pi -e .` from the repository root (outside a vault layout). The footer shows `● scratch`, and `/chronicle:end` writes to `./Progress/chronicle-YYYYMMDD-HHmm.md` relative to that cwd.

Distill and novel follow-ups reuse the same resolved project:

- `/chronicle:distill` recommends `Progress/chronicle-distill-<format>-YYYYMMDD-HHmm.md` under the resolved project.
- `/chronicle:novel` recommends `novel-YYYYMMDD-HHmm.md` in the project root (the parent directory of `Progress/`).
