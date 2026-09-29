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

The renderer keeps these headings stable so chronicle files can be searched or processed by other tools:

```markdown
# Chronicle — <session name>
started: YYYY-MM-DD HH:MM
ended: YYYY-MM-DD HH:MM

## Marks
- HH:MM — label

## Beats
### HH:MM · type · label

## Closing
optional closing note
```

- **Title:** `# Chronicle — <session name>` uses the session name verbatim.
- **Marks:** each timestamped label is `- HH:MM — label`.
- **Beats:** each typed entry (`decision`, `blocker`, `milestone`, `try`, or `revert`) is `### HH:MM · type · label`.
- **Closing:** `## Closing` is written only when `/chronicle:end` receives a non-empty closing note. `/chronicle:export` never writes it.
- **Empty fields:** `## Marks` and `## Beats` are always emitted. With no entries, each heading is followed by an empty line; no placeholder list item is generated. The `started:` and `ended:` fields are always emitted.
- **Links:** the renderer does not create links or escape labels. Markdown link syntax entered in a label or closing note is preserved verbatim.
- **`ended:` timestamp** records when the file was written. For `/chronicle:export`, it is the snapshot time — the session stays active and may continue after export. For `/chronicle:end`, it is the session finish time.

## Export vs end

| | `/chronicle:export` | `/chronicle:end` |
|---|---|---|
| Session | stays active | ends (cleared) |
| Closing note | none | optional prompt |
| Existing file | **refuses** (fail closed) | **overwrites** |
| Use when | checkpoint mid-session | finalize and close |
| Empty session | warns (no marks or beats) | allowed (writes empty sections) |

**Recommendation:** Use export once mid-session to drop a vault-ready checkpoint without copy/paste. Continue marking and beating, then run end to overwrite the same filename with the final chronicle and optional closing note.

## Overwrite rules

- `/chronicle:export` never silently replaces an existing chronicle file. If `Progress/chronicle-YYYYMMDD-HHmm.md` already exists, the command shows a warning and leaves the file unchanged.
- `/chronicle:end` always writes the final chronicle for the session and overwrites the same deterministic filename. Use end when you are done and accept replacing an earlier export snapshot from the same session start time.
- Historical chronicle files from earlier sessions (different start times) are never touched by either command.

See [`examples.md`](examples.md) for a full vault workflow example.
