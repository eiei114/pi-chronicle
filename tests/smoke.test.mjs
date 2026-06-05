import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join, sep, normalize } from "node:path";

// Re-implement pure logic locally for .mjs test (no TS import needed)

function detectProject(cwd) {
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

describe("project detection", () => {
  it("detects project from 4_Project path", () => {
    const cwd = join("C:", "Users", "dev", "vault", "4_Project", "pi-chronicle", "Docs");
    const result = detectProject(cwd);
    assert.equal(result?.key, "pi-chronicle");
    assert.ok(
      result.progressDir.includes(join("pi-chronicle", "Progress")),
      `progressDir should contain pi-chronicle/Progress, got: ${result.progressDir}`,
    );
  });

  it("returns undefined when not under 4_Project", () => {
    const result = detectProject(join("tmp", "some-random-dir"));
    assert.equal(result, undefined);
  });

  it("handles nested project paths", () => {
    const cwd = join("home", "user", "vault", "4_Project", "oss-development", "Issues");
    const result = detectProject(cwd);
    assert.equal(result?.key, "oss-development");
  });
});
