import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs, {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { syncBuiltinESMExports } from "node:module";
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

  it("preserves a snapshot claimed at write time", (t) => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-output-"));
    t.after(() => rmSync(progressDir, { recursive: true, force: true }));
    const session = makeSession(progressDir);
    const filePath = chronicleFilePath(session);
    const competingSnapshot = "snapshot from another session";
    const realWrite = writeFileSync;
    const write = t.mock.method(fs, "writeFileSync", (path, ...args) => {
      // Claim the destination immediately before the writer's real filesystem call.
      if (path === filePath) {
        realWrite(path, competingSnapshot, { encoding: "utf8", flag: "wx" });
      }
      return realWrite(path, ...args);
    });
    syncBuiltinESMExports();
    try {
      assert.deepEqual(writeChronicleSnapshot(session, {
        endedAt: new Date(2026, 5, 5, 15, 10),
        overwrite: false,
      }), { ok: false, reason: "FILE_EXISTS", filePath });
      assert.equal(readFileSync(filePath, "utf8"), competingSnapshot);
    } finally {
      write.mock.restore();
      syncBuiltinESMExports();
    }
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

  it("creates a new snapshot and its Progress directory without overwrite", (t) => {
    const root = mkdtempSync(join(tmpdir(), "pi-chronicle-output-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const progressDir = join(root, "Progress");
    const session = makeSession(progressDir);
    const endedAt = new Date(2026, 5, 5, 15, 10);

    const result = writeChronicleSnapshot(session, {
      endedAt,
      overwrite: false,
    });

    const filePath = join(progressDir, "chronicle-20260605-1430.md");
    assert.deepEqual(result, { ok: true, filePath });
    assert.equal(readFileSync(filePath, "utf8"), renderChronicle(session, endedAt));
  });
});
