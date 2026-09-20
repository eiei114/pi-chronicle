/** Shown when getSession() returns undefined (session ended or not started yet). */
export const NO_ACTIVE_SESSION =
  "No active session. Sessions auto-start when Pi loads.";

/** Shown when a session exists but has no marks or beats recorded yet. */
export const EMPTY_SESSION_ENTRIES =
  "Session has no marks or beats yet. Record entries with /chronicle:mark or /chronicle:beat first.";

/** Distill-specific variant of the no-active-session guard. */
export const NO_ACTIVE_SESSION_DISTILL = "No active session to distill.";

export function SNAPSHOT_SAVED(filePath: string): string {
  return `Chronicle snapshot saved: ${filePath}`;
}

export function SNAPSHOT_ALREADY_EXISTS(filePath: string): string {
  return `Chronicle file already exists: ${filePath}. Add more marks or beats, then use /chronicle:end to overwrite with the final version and close the session.`;
}
