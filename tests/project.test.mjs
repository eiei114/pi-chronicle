import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectProject, resolveProject } from "../lib/project.ts";

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "pi-chronicle-project-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function withOutsideVaultCwd(workspaceName, fn) {
  if (process.platform === "win32") {
    const root = mkdtempSync(join(tmpdir(), "pi-chronicle-outside-vault-"));
    let drive;
    try {
      for (const letter of ["X", "Y", "Z", "W", "V", "U", "T"]) {
        try {
          execSync(`cmd /c subst ${letter}: "${root}"`, { stdio: "ignore" });
          drive = letter;
          break;
        } catch {
          // try next drive letter
        }
      }
      if (!drive) {
        throw new Error("Could not create isolated outside-vault fixture drive");
      }
      const cwd = join(`${drive}:\\`, "no-vault", `run-${process.pid}`, workspaceName);
      mkdirSync(cwd, { recursive: true });
      return fn(cwd);
    } finally {
      if (drive) {
        try {
          execSync(`cmd /c subst ${drive}: /d`, { stdio: "ignore" });
        } catch {
          // Best-effort cleanup for an isolated fixture drive.
        }
      }
      rmSync(root, { recursive: true, force: true });
    }
  }

  return withTempDir((root) => {
    const isolation = Array.from({ length: 20 }, (_, i) => `isolation-${i}`);
    const cwd = join(
      root,
      ...isolation,
      "no-vault",
      `run-${process.pid}`,
      workspaceName,
    );
    mkdirSync(cwd, { recursive: true });
    return fn(cwd);
  });
}

describe("detectProject", () => {
  it("detects a project key and Progress directory from a 4_Project path", () => {
    withTempDir((root) => {
      const cwd = join(root, "vault", "4_Project", "pi-chronicle", "Docs", "Notes");
      const result = detectProject(cwd);

      assert.deepEqual(result, {
        key: "pi-chronicle",
        progressDir: join(root, "vault", "4_Project", "pi-chronicle", "Progress"),
      });
    });
  });

  it("returns undefined outside a 4_Project project path", () => {
    withTempDir((root) => {
      assert.equal(detectProject(join(root, "vault", "Inbox")), undefined);
    });
  });
});

describe("resolveProject", () => {
  it("uses detected project paths before fallback keys", () => {
    withTempDir((root) => {
      const cwd = join(root, "vault", "4_Project", "detected", "Issues");

      assert.deepEqual(resolveProject(cwd, "manual"), {
        key: "detected",
        progressDir: join(root, "vault", "4_Project", "detected", "Progress"),
      });
    });
  });

  it("falls back to scratch and cwd/Progress when no project or vault root is found", () => {
    withOutsideVaultCwd("scratch-workspace", (cwd) => {
      assert.deepEqual(resolveProject(cwd), {
        key: "scratch",
        progressDir: join(cwd, "Progress"),
      });
    });
  });

  it("uses a manual fallback key", () => {
    withOutsideVaultCwd("manual-workspace", (cwd) => {
      assert.deepEqual(resolveProject(cwd, "maintenance"), {
        key: "maintenance",
        progressDir: join(cwd, "Progress"),
      });
    });
  });

  it("places fallback projects under the discovered vault root", () => {
    withTempDir((root) => {
      const vault = join(root, "vault");
      const cwd = join(vault, "Inbox", "Today");
      mkdirSync(join(vault, ".obsidian"), { recursive: true });
      mkdirSync(cwd, { recursive: true });

      assert.deepEqual(resolveProject(cwd, "pi-chronicle"), {
        key: "pi-chronicle",
        progressDir: join(vault, "4_Project", "pi-chronicle", "Progress"),
      });
    });
  });
});
