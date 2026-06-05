import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { detectProject, resolveProject } from "../lib/project.ts";

export function registerChronicleStartStatus(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
  setSession: (s: ChronicleSession | undefined) => void,
): void {
  pi.registerCommand("chronicle:start", {
    description: "Start a chronicle session",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      if (getSession()) {
        ctx.ui.notify(
          "Session already active. Run /chronicle:end first.",
          "warning",
        );
        return;
      }

      // Resolve project from cwd
      const detected = detectProject(ctx.cwd);
      let projectKey: string | undefined;

      if (!detected) {
        projectKey = await ctx.ui.input("Project name:");
        if (projectKey === undefined || projectKey.trim() === "") return;
        projectKey = projectKey.trim();
      }

      const project = resolveProject(ctx.cwd, projectKey);

      const name = await ctx.ui.input("Session name:");
      if (name === undefined || name.trim() === "") return;

      const session: ChronicleSession = {
        name: name.trim(),
        project,
        startedAt: new Date(),
        marks: [],
        beats: [],
      };

      setSession(session);
      ctx.ui.notify(
        `Chronicle started: "${session.name}" (${project.key})`,
        "info",
      );
    },
  });

  pi.registerCommand("chronicle:status", {
    description: "Show current chronicle session status",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify("No active session.", "info");
        return;
      }

      const started = formatTime(session.startedAt);
      const elapsed = formatElapsed(session.startedAt);
      ctx.ui.notify(
        [
          `Session: ${session.name}`,
          `Project: ${session.project.key}`,
          `Started: ${started} (${elapsed})`,
          `Marks: ${session.marks.length}`,
          `Beats: ${session.beats.length}`,
        ].join("\n"),
        "info",
      );
    },
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatElapsed(since: Date): string {
  const ms = Date.now() - since.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
}
