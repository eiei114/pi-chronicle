import { join } from "node:path";
import type { ChronicleSession, DistillType } from "./session.ts";

export const DISTILL_FORMAT_CONTRACTS = {
  flow: "chronological work flow, decisions, blockers, reverts, milestones, and next action.",
  textbook: "learner-facing explanation with background, steps, cautions, and terms.",
  essay: "reflective prose about what changed, why, and what was learned.",
  fiction: "short narrative entrypoint aligned with /chronicle:novel, but reached through the distill format chooser.",
} satisfies Record<DistillType, string>;

export function hasChronicleEntries(session: ChronicleSession): boolean {
  return session.marks.length > 0 || session.beats.length > 0;
}

export function formatFilenameTs(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}${mo}${d}-${h}${mi}`;
}

export function renderChronicleForPrompt(session: ChronicleSession): string {
  const lines: string[] = [];

  lines.push(`セッション名: ${session.name}`);
  lines.push(`プロジェクトキー: ${session.project.key}`);
  lines.push(`開始時刻: ${session.startedAt.toLocaleString("ja-JP")}`);
  lines.push(`マーク数: ${session.marks.length}`);
  lines.push(`ビート数: ${session.beats.length}`);
  lines.push("");
  lines.push("### 時系列");

  const entries = [
    ...session.marks.map((mark, index) => ({
      kind: "mark" as const,
      time: mark.time,
      label: mark.label,
      index,
    })),
    ...session.beats.map((beat, index) => ({
      kind: "beat" as const,
      time: beat.time,
      type: beat.type,
      label: beat.label,
      index: session.marks.length + index,
    })),
  ].sort((a, b) => {
    const byTime = a.time.getTime() - b.time.getTime();
    return byTime === 0 ? a.index - b.index : byTime;
  });

  if (entries.length === 0) {
    lines.push("- (no marks or beats)");
  } else {
    for (const entry of entries) {
      if (entry.kind === "mark") {
        lines.push(`- ${formatPromptTime(entry.time)} — mark — ${entry.label}`);
      } else {
        lines.push(`- ${formatPromptTime(entry.time)} — beat:${entry.type} — ${entry.label}`);
      }
    }
  }

  return lines.join("\n");
}

export function renderDistillPrompt(
  session: ChronicleSession,
  format: DistillType,
): string {
  const filename = `chronicle-distill-${format}-${formatFilenameTs(session.startedAt)}.md`;
  const outputPath = join(session.project.progressDir, filename);

  return [
    "以下の作業セッション記録を元に、再利用できるMarkdown成果物を1つ作成してください。",
    "Pi Chronicleの記録だけを根拠にし、足りない情報は推測で断定しないでください。",
    "",
    `出力ファイル: ${outputPath}`,
    `推奨ファイル名: ${filename}`,
    "出力形式: Markdown。見出し・段落・箇条書きを使い、Markdown本文だけを作成してください。",
    "",
    "## 選択フォーマット",
    `format: ${format}`,
    `フォーマット契約: ${DISTILL_FORMAT_CONTRACTS[format]}`,
    "",
    "## セッション記録",
    "",
    renderChronicleForPrompt(session),
  ].join("\n");
}

function formatPromptTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
