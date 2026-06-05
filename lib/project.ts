/**
 * Project detection — resolve the output project from Pi's ctx.cwd.
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, normalize, sep } from "node:path";

/**
 * Walk upward from `cwd` to find a `4_Project/<project>/` segment.
 * Returns `{ key, progressDir }` or `undefined`.
 */
export function detectProject(
  cwd: string,
): { key: string; progressDir: string } | undefined {
  const normalized = normalize(cwd);
  const segments = normalized.split(sep);

  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i] === "4_Project" && i + 1 < segments.length) {
      const projectKey = segments[i + 1];
      if (!projectKey) continue;
      const projectRoot = segments.slice(0, i + 2).join(sep);
      const progressDir = join(projectRoot, "Progress");
      return { key: projectKey, progressDir };
    }
  }

  return undefined;
}

/**
 * Resolve project info: auto-detect from cwd, or fall back to a manual key.
 * When falling back, progressDir is computed by walking up to find the vault root
 * (directory containing `.pi/` or `.obsidian/`), then joining `4_Project/<key>/Progress/`.
 */
export function resolveProject(
  cwd: string,
  manualKey?: string,
): { key: string; progressDir: string } {
  const detected = detectProject(cwd);
  if (detected) return detected;

  const key = manualKey ?? "scratch";
  const vaultRoot = findVaultRoot(cwd);
  const progressDir = vaultRoot
    ? join(vaultRoot, "4_Project", key, "Progress")
    : join(cwd, "Progress");

  return { key, progressDir };
}

/**
 * Walk upward to find a directory containing `.pi/` or `.obsidian/`.
 */
export function findVaultRoot(cwd: string): string | undefined {
  let dir = normalize(cwd);

  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, ".pi")) || existsSync(join(dir, ".obsidian"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

/**
 * Ensure a directory exists.
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
