import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { DISTILL_TYPES } from "../lib/session.ts";

export function registerChronicleDistill(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:distill", {
    description: "Select a distill format (stub — v0.2.0)",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(
          "No active session to distill.",
          "warning",
        );
        return;
      }

      const format = await ctx.ui.select("Distill format:", [...DISTILL_TYPES]);
      if (format === undefined) return;

      ctx.ui.notify(`Distill (${format}) — coming in v0.2.0`, "info");
    },
  });
}
