import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChronicleSession } from "./session.ts";
import { renderChronicle } from "./render-chronicle.ts";
import { ensureDir } from "./project.ts";
import { formatFilenameTs } from "./prompt.ts";

export function chronicleFilename(startedAt: Date): string {
  return `chronicle-${formatFilenameTs(startedAt)}.md`;
}

export function chronicleFilePath(session: ChronicleSession): string {
  return join(session.project.progressDir, chronicleFilename(session.startedAt));
}

export type WriteChronicleResult =
  | { ok: true; filePath: string }
  | { ok: false; reason: "FILE_EXISTS"; filePath: string };

export function writeChronicleSnapshot(
  session: ChronicleSession,
  options: {
    endedAt: Date;
    closingNote?: string;
    overwrite: boolean;
  },
): WriteChronicleResult {
  const filePath = chronicleFilePath(session);

  ensureDir(session.project.progressDir);

  const md = renderChronicle(
    session,
    options.endedAt,
    options.closingNote,
  );
  try {
    writeFileSync(filePath, md, {
      encoding: "utf-8",
      flag: options.overwrite ? "w" : "wx",
    });
  } catch (err) {
    if (!options.overwrite && (err as NodeJS.ErrnoException).code === "EEXIST") {
      return { ok: false, reason: "FILE_EXISTS", filePath };
    }
    throw err;
  }
  return { ok: true, filePath };
}
