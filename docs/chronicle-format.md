# Chronicle format

Pi Chronicle writes session snapshots as Markdown under each project's `Progress/` folder.

## File naming

Both `/chronicle:export` and `/chronicle:end` use the same deterministic filename derived from the session start time:

```text
Progress/chronicle-YYYYMMDD-HHmm.md
```

Example vault path:

```text
vault/4_Project/pi-chronicle/Progress/chronicle-20260605-1430.md
```

## Markdown structure

```markdown
# Chronicle — YYYY-MM-DD
started: YYYY-MM-DD HH:MM
ended: YYYY-MM-DD HH:MM

## Marks
- HH:MM — label

## Beats
### HH:MM · type · label

## Closing
optional closing note
```

- **Marks** are timestamped labels (`- HH:MM — label`).
- **Beats** are typed entries (`decision`, `blocker`, `milestone`, `try`, `revert`) rendered as `### HH:MM · type · label`.
- **Closing** appears only when `/chronicle:end` receives a closing note. `/chronicle:export` never writes a Closing section.

## Export vs end

| | `/chronicle:export` | `/chronicle:end` |
|---|---|---|
| Session | stays active | ends (cleared) |
| Closing note | none | optional prompt |
| Existing file | **refuses** (fail closed) | **overwrites** |
| Use when | checkpoint mid-session | finalize and close |

## Overwrite rules

- `/chronicle:export` never silently replaces an existing chronicle file. If `Progress/chronicle-YYYYMMDD-HHmm.md` already exists, the command shows a warning and leaves the file unchanged.
- `/chronicle:end` always writes the final chronicle for the session and overwrites the same deterministic filename. Use end when you are done and accept replacing an earlier export snapshot from the same session start time.
- Historical chronicle files from earlier sessions (different start times) are never touched by either command.

See [`examples.md`](examples.md) for a full vault workflow example.
