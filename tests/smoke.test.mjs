import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { detectProject } from "../lib/project.ts";

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
