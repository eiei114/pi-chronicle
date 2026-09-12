import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { writeChronicleSnapshot } from "../lib/chronicle-output.ts";

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

      const result = writeChronicleSnapshot(session, {
        endedAt: new Date(),
        closingNote: closingNote?.trim() || undefined,
        overwrite: true,
      });

      setSession(undefined);
      ctx.ui.notify(`Chronicle saved: ${result.filePath}`, "info");
    },
  });
}
