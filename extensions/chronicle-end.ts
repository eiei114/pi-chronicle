import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { chronicleFilePath, writeChronicleSnapshot } from "../lib/chronicle-output.ts";
import { NO_ACTIVE_SESSION } from "../lib/session-messages.ts";

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
        ctx.ui.notify(NO_ACTIVE_SESSION, "warning");
        return;
      }

      const closingNote = await ctx.ui.input("Closing note (optional):");

      let result;
      try {
        result = writeChronicleSnapshot(session, {
          endedAt: new Date(),
          closingNote: closingNote?.trim() || undefined,
          overwrite: true,
        });
      } catch {
        ctx.ui.notify(
          `Could not save the final Chronicle to ${chronicleFilePath(session)}. ` +
            "Your session is still active. Check the vault path, write permissions, " +
            "and free space, then retry /chronicle:end.",
          "error",
        );
        return;
      }

      setSession(undefined);
      ctx.ui.setStatus("chronicle", "");
      ctx.ui.notify(`Chronicle saved: ${result.filePath}`, "info");
    },
  });
}
