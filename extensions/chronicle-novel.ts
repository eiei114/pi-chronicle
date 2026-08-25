import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import {
  formatFilenameTs,
  hasChronicleEntries,
  renderChronicleForPrompt,
} from "../lib/prompt.ts";
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

      if (!hasChronicleEntries(session)) {
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
