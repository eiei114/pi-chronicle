# Examples

## Quick session workflow

```text
/chronicle:start   → enter "Pages bootstrap"
/chronicle:mark    → enter "CI 緑"
/chronicle:beat    → select "milestone" → enter "auto-release.yml 動作確認"
/chronicle:beat    → select "blocker" → enter "npm provenance 設定不明"
/chronicle:mark    → enter "Trusted Publishing 解決"
/chronicle:end     → enter "初回リリース完了" → writes chronicle md
```

## Output file

```markdown
# Chronicle — Pages bootstrap
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

## Distill (v0.2.0)

```text
/chronicle:distill → select "flow" → (coming in v0.2.0)
```
