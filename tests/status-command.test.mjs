import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { registerChronicleStatus } from "../extensions/chronicle-core.ts";
import {
  EMPTY_SESSION_ENTRIES,
  NO_ACTIVE_SESSION,
} from "../lib/session-messages.ts";

function makeSession(overrides = {}) {
  return {
    name: "2026-09-07",
    project: {
      key: "pi-chronicle",
      progressDir: join("vault", "4_Project", "pi-chronicle", "Progress"),
    },
    startedAt: new Date(2026, 8, 7, 11, 30),
    marks: [],
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

describe("chronicle:status", () => {
  it("reports no active session when getSession returns undefined", async () => {
    const { commands, pi } = createPiHarness();
    registerChronicleStatus(pi, () => undefined);
    const context = createContext();

    await getCommand(commands, "chronicle:status").handler("", context.ctx);

    assert.deepEqual(context.notifications, [
      { message: NO_ACTIVE_SESSION, level: "info" },
    ]);
  });

  it("includes an empty-session hint when marks and beats are both zero", async () => {
    const session = makeSession();
    const { commands, pi } = createPiHarness();
    registerChronicleStatus(pi, () => session);
    const context = createContext();

    await getCommand(commands, "chronicle:status").handler("", context.ctx);

    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].level, "info");
    assert.match(context.notifications[0].message, /Session: 2026-09-07/);
    assert.match(context.notifications[0].message, /Marks: 0/);
    assert.match(context.notifications[0].message, /Beats: 0/);
    assert.match(context.notifications[0].message, new RegExp(escapeRegex(EMPTY_SESSION_ENTRIES)));
  });

  it("omits the empty-session hint when marks or beats exist", async () => {
    const session = makeSession({
      marks: [{ time: new Date(2026, 8, 7, 11, 35), label: "Started work" }],
    });
    const { commands, pi } = createPiHarness();
    registerChronicleStatus(pi, () => session);
    const context = createContext();

    await getCommand(commands, "chronicle:status").handler("", context.ctx);

    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].level, "info");
    assert.match(context.notifications[0].message, /Marks: 1/);
    assert.doesNotMatch(context.notifications[0].message, new RegExp(escapeRegex(EMPTY_SESSION_ENTRIES)));
  });
});

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
