import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { formatTime } from "./chronicle-core.ts";
import { join } from "node:path";

export function registerChronicleNovel(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:novel", {
    description: "Generate a novel from session records and write to project root",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(
          "No active session. Sessions auto-start when Pi loads.",
          "warning",
        );
        return;
      }

      if (session.marks.length === 0 && session.beats.length === 0) {
        ctx.ui.notify(
          "Session has no marks or beats yet. Add some first.",
          "warning",
        );
        return;
      }

      const chronicleText = renderChronicleForPrompt(session);
      const ts = formatFilenameTs(session.startedAt);
      const filename = `novel-${ts}.md`;
      const projectRoot = join(session.project.progressDir, "..");
      const outputPath = join(projectRoot, filename);

      const prompt = [
        `以下の作業セッション記録を元に、短編小説を書いてください。`,
        `作業の文脈・感情・流れを物語として再構成してください。`,
        `技術用語はそのまま使って構いませんが、ストーリーとして読めるようにしてください。`,
        ``,
        `出力ファイル: ${outputPath}`,
        `形式: Markdown (見出し・段落付き)`,
        ``,
        `## セッション記録`,
        ``,
        chronicleText,
      ].join("\n");

      pi.sendUserMessage(prompt, { deliverAs: "followUp" });
      ctx.ui.notify("Generating novel from chronicle…", "info");
    },
  });
}

function formatFilenameTs(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}${mo}${d}-${h}${mi}`;
}

function renderChronicleForPrompt(session: ChronicleSession): string {
  const lines: string[] = [];

  lines.push(`セッション名: ${session.name}`);
  lines.push(`開始: ${session.startedAt.toLocaleString("ja-JP")}`);
  lines.push(`マーク数: ${session.marks.length}`);
  lines.push(`ビート数: ${session.beats.length}`);
  lines.push("");

  if (session.marks.length > 0) {
    lines.push("### マーク（意識マーカー）");
    for (const m of session.marks) {
      lines.push(`- ${formatTime(m.time)} — ${m.label}`);
    }
    lines.push("");
  }

  if (session.beats.length > 0) {
    lines.push("### ビート（型付きイベント）");
    for (const b of session.beats) {
      lines.push(`- ${formatTime(b.time)} · ${b.type} · ${b.label}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
