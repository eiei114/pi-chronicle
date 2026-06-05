import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { formatTime } from "./chronicle-core.ts";

export function registerChronicleMark(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:mark", {
    description: "Add a mark to the current chronicle session",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(
          "No active session. Run /chronicle:start first.",
          "warning",
        );
        return;
      }

      const label = await ctx.ui.input("Mark label:");
      if (label === undefined || label.trim() === "") return;

      session.marks.push({ time: new Date(), label: label.trim() });
      ctx.ui.notify(
        `Mark: ${label.trim()} @ ${formatTime(new Date())}`,
        "info",
      );
    },
  });
}
