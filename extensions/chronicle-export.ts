import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { hasChronicleEntries } from "../lib/prompt.ts";
import { writeChronicleSnapshot } from "../lib/chronicle-output.ts";
import {
  EMPTY_SESSION_ENTRIES,
  NO_ACTIVE_SESSION,
  SNAPSHOT_ALREADY_EXISTS,
  SNAPSHOT_SAVED,
} from "../lib/session-messages.ts";

export function registerChronicleExport(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:export", {
    description:
      "Export current chronicle session snapshot to vault without ending session",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(NO_ACTIVE_SESSION, "warning");
        return;
      }

      if (!hasChronicleEntries(session)) {
        ctx.ui.notify(EMPTY_SESSION_ENTRIES, "warning");
        return;
      }

      const result = writeChronicleSnapshot(session, {
        endedAt: new Date(),
        overwrite: false,
      });

      if (!result.ok) {
        ctx.ui.notify(SNAPSHOT_ALREADY_EXISTS(result.filePath), "warning");
        return;
      }

      ctx.ui.notify(SNAPSHOT_SAVED(result.filePath), "info");
    },
  });
}
