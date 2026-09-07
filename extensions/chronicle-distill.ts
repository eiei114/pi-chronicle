import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession, DistillType } from "../lib/session.ts";
import { DISTILL_TYPES } from "../lib/session.ts";
import { hasChronicleEntries, renderDistillPrompt } from "../lib/prompt.ts";
import {
  EMPTY_SESSION_ENTRIES,
  NO_ACTIVE_SESSION_DISTILL,
} from "../lib/session-messages.ts";

export function registerChronicleDistill(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:distill", {
    description: "Hand off a chronicle distill prompt for a Markdown artifact",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(NO_ACTIVE_SESSION_DISTILL, "warning");
        return;
      }

      if (!hasChronicleEntries(session)) {
        ctx.ui.notify(EMPTY_SESSION_ENTRIES, "warning");
        return;
      }

      const format = await ctx.ui.select("Distill format:", [...DISTILL_TYPES]);
      if (format === undefined) return;

      const prompt = renderDistillPrompt(session, format as DistillType);
      pi.sendUserMessage(prompt, { deliverAs: "followUp" });
      ctx.ui.notify(`Handed off chronicle distill (${format}) generation.`, "info");
    },
  });
}
