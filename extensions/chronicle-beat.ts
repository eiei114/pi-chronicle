import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { BEAT_TYPE_LABELS, BEAT_TYPES } from "../lib/session.ts";
import { formatTime } from "./chronicle-core.ts";

export function registerChronicleBeat(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:beat", {
    description: "Add a typed beat to the current chronicle session",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(
          "No active session. Sessions auto-start when Pi loads.",
          "warning",
        );
        return;
      }

      const typeOptions = BEAT_TYPES.map(
        (t) => BEAT_TYPE_LABELS[t],
      );
      const selectedLabel = await ctx.ui.select("Beat type:", typeOptions);
      if (selectedLabel === undefined) return;

      const beatType = BEAT_TYPES.find(
        (t) => BEAT_TYPE_LABELS[t] === selectedLabel,
      );
      if (!beatType) return;

      const label = await ctx.ui.input("Label:");
      if (label === undefined || label.trim() === "") return;

      session.beats.push({
        time: new Date(),
        type: beatType,
        label: label.trim(),
      });
      ctx.ui.notify(
        `Beat: ${beatType} · ${label.trim()} @ ${formatTime(new Date())}`,
        "info",
      );
    },
  });
}
