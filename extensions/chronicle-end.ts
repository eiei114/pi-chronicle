import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { renderChronicle } from "../lib/render-chronicle.ts";
import { ensureDir } from "../lib/project.ts";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export function registerChronicleEnd(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
  setSession: (s: ChronicleSession | undefined) => void,
): void {
  pi.registerCommand("chronicle:end", {
    description: "End chronicle session and write markdown to vault",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(
          "No active session. Sessions auto-start when Pi loads.",
          "warning",
        );
        return;
      }

      const closingNote = await ctx.ui.input("Closing note (optional):");

      const endedAt = new Date();
      const md = renderChronicle(session, endedAt, closingNote?.trim() || undefined);

      // Filename from startedAt
      const ts = formatFilenameTs(session.startedAt);
      const filename = `chronicle-${ts}.md`;
      const progressDir = session.project.progressDir;

      ensureDir(progressDir);
      const filePath = join(progressDir, filename);
      writeFileSync(filePath, md, "utf-8");

      setSession(undefined);
      ctx.ui.notify(`Chronicle saved: ${filePath}`, "info");
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


