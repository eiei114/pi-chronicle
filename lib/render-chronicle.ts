import type { ChronicleSession } from "./session.ts";

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function renderChronicle(
  session: ChronicleSession,
  endedAt: Date,
  closingNote?: string,
): string {
  const lines: string[] = [];

  lines.push(`# Chronicle — ${session.name}`);
  lines.push(`started: ${formatDateTime(session.startedAt)}`);
  lines.push(`ended: ${formatDateTime(endedAt)}`);
  lines.push("");

  lines.push("## Marks");
  if (session.marks.length === 0) {
    lines.push("");
  } else {
    for (const m of session.marks) {
      lines.push(`- ${formatTime(m.time)} — ${m.label}`);
    }
  }
  lines.push("");

  lines.push("## Beats");
  if (session.beats.length === 0) {
    lines.push("");
  } else {
    for (const b of session.beats) {
      lines.push(`### ${formatTime(b.time)} · ${b.type} · ${b.label}`);
      lines.push("");
    }
  }

  if (closingNote) {
    lines.push("## Closing");
    lines.push(closingNote);
    lines.push("");
  }

  return lines.join("\n");
}
