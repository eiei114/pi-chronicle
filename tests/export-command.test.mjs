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
import { registerChronicleExport } from "../extensions/chronicle-export.ts";
import {
  NO_ACTIVE_SESSION,
  SNAPSHOT_ALREADY_EXISTS,
  SNAPSHOT_SAVED,
} from "../lib/session-messages.ts";
import { renderChronicle } from "../lib/render-chronicle.ts";
import { chronicleFilePath } from "../lib/chronicle-output.ts";

function makeSession(progressDir, overrides = {}) {
  return {
    name: "2026-09-07",
    project: {
      key: "pi-chronicle",
      progressDir,
    },
    startedAt: new Date(2026, 8, 7, 11, 30),
    marks: [{ time: new Date(2026, 8, 7, 11, 35), label: "Started work" }],
    beats: [],
    ...overrides,
  };
}

function createPiHarness() {
  const commands = new Map();
  const pi = {
    registerCommand(name, command) {
      commands.set(name, command);
    },
  };

  return { commands, pi };
}

function createContext() {
  const notifications = [];
  const ctx = {
    ui: {
      notify(message, level) {
        notifications.push({ message, level });
      },
    },
  };

  return { ctx, notifications };
}

function getCommand(commands, name) {
  const command = commands.get(name);
  assert.ok(command, `${name} should be registered`);
  return command;
}

describe("chronicle:export", () => {
  it("writes a readable snapshot for the active session", async () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-export-"));
    const session = makeSession(progressDir);
    let activeSession = session;
    const { commands, pi } = createPiHarness();
    registerChronicleExport(pi, () => activeSession);
    const context = createContext();

    await getCommand(commands, "chronicle:export").handler("", context.ctx);

    const filePath = chronicleFilePath(session);
    assert.ok(existsSync(filePath));
    const content = readFileSync(filePath, "utf8");
    assert.match(content, /# Chronicle — 2026-09-07/);
    assert.match(content, /## Marks/);
    assert.match(content, /Started work/);
    assert.doesNotMatch(content, /## Closing/);
    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].level, "info");
    assert.equal(
      context.notifications[0].message,
      SNAPSHOT_SAVED(filePath),
    );
    assert.equal(activeSession, session, "export should keep the session active");
  });

  it("fails closed when no active session exists", async () => {
    const { commands, pi } = createPiHarness();
    registerChronicleExport(pi, () => undefined);
    const context = createContext();

    await getCommand(commands, "chronicle:export").handler("", context.ctx);

    assert.deepEqual(context.notifications, [
      { message: NO_ACTIVE_SESSION, level: "warning" },
    ]);
  });

  it("refuses to overwrite an existing chronicle file", async () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-export-"));
    const session = makeSession(progressDir);
    const filePath = chronicleFilePath(session);
    const existingContent = "existing snapshot";
    writeFileSync(filePath, existingContent, "utf8");

    const { commands, pi } = createPiHarness();
    registerChronicleExport(pi, () => session);
    const context = createContext();

    await getCommand(commands, "chronicle:export").handler("", context.ctx);

    assert.equal(readFileSync(filePath, "utf8"), existingContent);
    assert.deepEqual(context.notifications, [
      {
        message: SNAPSHOT_ALREADY_EXISTS(filePath),
        level: "warning",
      },
    ]);
  });
});

describe("writeChronicleSnapshot overwrite behavior via export/end contract", () => {
  it("export snapshot content matches renderChronicle without closing note", () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-export-"));
    const session = makeSession(progressDir);
    const endedAt = new Date(2026, 8, 7, 12, 0);
    const expected = renderChronicle(session, endedAt);

    writeFileSync(chronicleFilePath(session), expected, "utf8");
    assert.equal(readFileSync(chronicleFilePath(session), "utf8"), expected);
  });
});
