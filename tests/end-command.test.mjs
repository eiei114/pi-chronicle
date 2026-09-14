import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { registerChronicleEnd } from "../extensions/chronicle-end.ts";
import { chronicleFilePath } from "../lib/chronicle-output.ts";

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
  const ctx = {
    ui: {
      async input() {
        return closingNote;
      },
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

describe("chronicle:end", () => {
  it("writes the final chronicle, clears the session, and overwrites export", async () => {
    const progressDir = mkdtempSync(join(tmpdir(), "pi-chronicle-end-"));
    const session = makeSession(progressDir);
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

    const filePath = chronicleFilePath(session);
    assert.ok(existsSync(filePath));
    const content = readFileSync(filePath, "utf8");
    assert.match(content, /## Closing/);
    assert.match(content, /初回リリース完了/);
    assert.equal(activeSession, undefined);
    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].level, "info");
    assert.match(context.notifications[0].message, /Chronicle saved:/);
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
      {
        message: "No active session. Sessions auto-start when Pi loads.",
        level: "warning",
      },
    ]);
  });
});
