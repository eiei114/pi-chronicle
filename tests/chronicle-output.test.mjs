import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  chronicleFilePath,
  writeChronicleSnapshot,
} from "../lib/chronicle-output.ts";
import { renderChronicle } from "../lib/render-chronicle.ts";

function makeSession(progressDir, overrides = {}) {
  return {
    name: "2026-06-05",
    project: {
      key: "pi-chronicle",
      progressDir,
    },
    startedAt: new Date(2026, 5, 5, 14, 30),
    marks: [{ time: new Date(2026, 5, 5, 14, 45), label: "CI 緑" }],
    beats: [
      {
        time: new Date(2026, 5, 5, 14, 50),
        type: "milestone",
        label: "auto-release.yml 動作確認",
      },
    ],
    ...overrides,
  };
}

describe("writeChronicleSnapshot", () => {
  it("writes markdown when overwrite is allowed", () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-output-"));
    const session = makeSession(progressDir);
    const endedAt = new Date(2026, 5, 5, 15, 10);

    const result = writeChronicleSnapshot(session, {
      endedAt,
      overwrite: true,
    });

    assert.equal(result.ok, true);
    assert.equal(
      readFileSync(result.filePath, "utf8"),
      renderChronicle(session, endedAt),
    );
  });

  it("refuses to overwrite when overwrite is false and file exists", () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-output-"));
    const session = makeSession(progressDir);
    const filePath = chronicleFilePath(session);
    const existingContent = "existing snapshot";
    writeFileSync(filePath, existingContent, "utf8");

    const result = writeChronicleSnapshot(session, {
      endedAt: new Date(2026, 5, 5, 15, 10),
      overwrite: false,
    });

    assert.deepEqual(result, {
      ok: false,
      reason: "FILE_EXISTS",
      filePath,
    });
    assert.equal(readFileSync(filePath, "utf8"), existingContent);
  });

  it("overwrites when overwrite is true even if file exists", () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-output-"));
    const session = makeSession(progressDir);
    const filePath = chronicleFilePath(session);
    writeFileSync(filePath, "stale export", "utf8");
    const endedAt = new Date(2026, 5, 5, 16, 15);
    const closingNote = "初回リリース完了";

    const result = writeChronicleSnapshot(session, {
      endedAt,
      closingNote,
      overwrite: true,
    });

    assert.equal(result.ok, true);
    const content = readFileSync(filePath, "utf8");
    assert.match(content, /## Closing/);
    assert.match(content, /初回リリース完了/);
    assert.doesNotMatch(content, /stale export/);
  });

  it("creates Progress directory when missing", () => {
    const progressDir = join(
      mkdtempSync(join(tmpdir(), "pi-chronicle-output-")),
      "Progress",
    );
    const session = makeSession(progressDir);

    const result = writeChronicleSnapshot(session, {
      endedAt: new Date(2026, 5, 5, 15, 10),
      overwrite: false,
    });

    assert.equal(result.ok, true);
    assert.ok(existsSync(progressDir));
    assert.ok(existsSync(result.filePath));
  });
});
