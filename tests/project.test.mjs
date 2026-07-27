import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, parse } from "node:path";
import { detectProject, resolveProject } from "../lib/project.ts";

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "pi-chronicle-project-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function outsideVaultPath(...segments) {
  const root = process.platform === "win32" ? "Z:\\" : parse(tmpdir()).root;
  return join(root, `pi-chronicle-no-vault-${process.pid}`, ...segments);
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
    const cwd = outsideVaultPath("scratch-workspace");

    assert.deepEqual(resolveProject(cwd), {
      key: "scratch",
      progressDir: join(cwd, "Progress"),
    });
  });

  it("uses a manual fallback key", () => {
    const cwd = outsideVaultPath("manual-workspace");

    assert.deepEqual(resolveProject(cwd, "maintenance"), {
      key: "maintenance",
      progressDir: join(cwd, "Progress"),
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
