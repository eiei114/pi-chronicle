import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";
import { detectProject, resolveProject } from "../lib/project.ts";
import { hasChronicleEntries } from "../lib/prompt.ts";
import {
  EMPTY_SESSION_ENTRIES,
  NO_ACTIVE_SESSION,
} from "../lib/session-messages.ts";

export function formatChronicleFooterStatus(session: ChronicleSession): string {
  const { key } = session.project;
  const marks = session.marks.length;
  const beats = session.beats.length;

  if (marks === 0 && beats === 0) {
    return `● ${key} · empty`;
  }

  return `● ${key} · ${marks}m ${beats}b`;
}

export function registerChronicleAutostart(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
  setSession: (s: ChronicleSession | undefined) => void,
): void {
  pi.on("session_start", (_event, ctx) => {
    if (getSession()) return; // already active

    const detected = detectProject(ctx.cwd);
    const project = resolveProject(ctx.cwd, detected ? undefined : "scratch");

    const now = new Date();
    const name = formatDateShort(now);

    const session: ChronicleSession = {
      name,
      project,
      startedAt: now,
      marks: [],
      beats: [],
    };

    setSession(session);
    ctx.ui.setStatus("chronicle", formatChronicleFooterStatus(session));
  });
}

export function registerChronicleStatus(
  pi: ExtensionAPI,
  getSession: () => ChronicleSession | undefined,
): void {
  pi.registerCommand("chronicle:status", {
    description: "Show current chronicle session status",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const session = getSession();
      if (!session) {
        ctx.ui.notify(NO_ACTIVE_SESSION, "info");
        return;
      }

      const started = formatTime(session.startedAt);
      const elapsed = formatElapsed(session.startedAt);
      const lines = [
        `Session: ${session.name}`,
        `Project: ${session.project.key}`,
        `Started: ${started} (${elapsed})`,
        `Marks: ${session.marks.length}`,
        `Beats: ${session.beats.length}`,
      ];

      if (!hasChronicleEntries(session)) {
        lines.push("", EMPTY_SESSION_ENTRIES);
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}

function formatDateShort(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
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
