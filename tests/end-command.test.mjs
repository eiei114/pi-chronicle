import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { registerChronicleEnd } from "../extensions/chronicle-end.ts";
import { chronicleFilePath } from "../lib/chronicle-output.ts";
import { NO_ACTIVE_SESSION } from "../lib/session-messages.ts";

function makeSession(progressDir, overrides = {}) {
  return {
    name: "2026-06-05",
    project: {
      key: "pi-chronicle",
      progressDir,
    },
    startedAt: new Date(2026, 5, 5, 14, 30),
    marks: [{ time: new Date(2026, 5, 5, 14, 45), label: "CI 緑" }],
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

function createContext(closingNote) {
  const notifications = [];
  const statusUpdates = [];
  const ctx = {
    ui: {
      async input() {
        return closingNote;
      },
      notify(message, level) {
        notifications.push({ message, level });
      },
      setStatus(key, value) {
        statusUpdates.push({ key, value });
      },
    },
  };

  return { ctx, notifications, statusUpdates };
}

function getCommand(commands, name) {
  const command = commands.get(name);
  assert.ok(command, `${name} should be registered`);
  return command;
}

describe("chronicle:end", () => {
  it("writes the final chronicle, clears the session, and overwrites export", async (t) => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-end-"));
    t.after(() => rmSync(progressDir, { recursive: true, force: true }));
    const session = makeSession(progressDir);
    const filePath = chronicleFilePath(session);
    writeFileSync(filePath, "Existing export snapshot", "utf8");
    let activeSession = session;
    const { commands, pi } = createPiHarness();
    registerChronicleEnd(
      pi,
      () => activeSession,
      (next) => {
        activeSession = next;
      },
    );
    const context = createContext("初回リリース完了");

    await getCommand(commands, "chronicle:end").handler("", context.ctx);

    const content = readFileSync(filePath, "utf8");
    assert.doesNotMatch(content, /Existing export snapshot/);
    assert.match(content, /## Closing/);
    assert.match(content, /初回リリース完了/);
    assert.equal(activeSession, undefined);
    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].level, "info");
    assert.match(context.notifications[0].message, /Chronicle saved:/);
    assert.deepEqual(context.statusUpdates, [{ key: "chronicle", value: "" }]);
  });

  it("reports a final-save failure and lets the same session retry", async (t) => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-end-"));
    t.after(() => rmSync(progressDir, { recursive: true, force: true }));
    const session = makeSession(progressDir, {
      beats: [{ time: new Date(2026, 5, 5, 14, 50), type: "milestone", label: "Tests pass" }],
    });
    const originalSession = structuredClone(session);
    const filePath = chronicleFilePath(session);
    mkdirSync(filePath); // A directory at the target cannot be overwritten as a file.

    let activeSession = session;
    const sessionUpdates = [];
    const { commands, pi } = createPiHarness();
    registerChronicleEnd(pi, () => activeSession, (next) => {
      sessionUpdates.push(next);
      activeSession = next;
    });
    const command = getCommand(commands, "chronicle:end");
    const { ctx, notifications, statusUpdates } = createContext("Final note");

    await command.handler("", ctx);

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].level, "error");
    assert.ok(notifications[0].message.includes(filePath));
    assert.match(notifications[0].message, /retry \/chronicle:end/);
    assert.equal(activeSession, session);
    assert.deepEqual(session, originalSession);
    assert.deepEqual(sessionUpdates, []);
    assert.deepEqual(statusUpdates, []);

    rmSync(filePath, { recursive: true });
    await command.handler("", ctx);

    const content = readFileSync(filePath, "utf8");
    assert.match(content, /CI 緑/);
    assert.match(content, /Tests pass/);
    assert.match(content, /Final note/);
    assert.deepEqual(notifications.slice(1), [
      { message: `Chronicle saved: ${filePath}`, level: "info" },
    ]);
    assert.deepEqual(sessionUpdates, [undefined]);
    assert.deepEqual(statusUpdates, [{ key: "chronicle", value: "" }]);
  });

  it("warns when no active session exists", async () => {
    const { commands, pi } = createPiHarness();
    registerChronicleEnd(
      pi,
      () => undefined,
      () => {},
    );
    const context = createContext("");

    await getCommand(commands, "chronicle:end").handler("", context.ctx);

    assert.deepEqual(context.notifications, [
      { message: NO_ACTIVE_SESSION, level: "warning" },
    ]);
  });
});
