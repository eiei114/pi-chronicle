import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { registerChronicleDistill } from "../extensions/chronicle-distill.ts";
import { registerChronicleNovel } from "../extensions/chronicle-novel.ts";
import {
  DISTILL_FORMAT_CONTRACTS,
  formatFilenameTs,
} from "../lib/prompt.ts";

const DISTILL_FORMATS = ["flow", "textbook", "essay", "fiction"];

function makeSession(overrides = {}) {
  return {
    name: "Sprint distill",
    project: {
      key: "pi-chronicle",
      progressDir: join("vault", "4_Project", "pi-chronicle", "Progress"),
    },
    startedAt: new Date(2026, 7, 17, 10, 30),
    marks: [
      { time: new Date(2026, 7, 17, 10, 35), label: "Outlined distill prompt" },
    ],
    beats: [
      {
        time: new Date(2026, 7, 17, 10, 40),
        type: "decision",
        label: "Use followUp handoff",
      },
    ],
    ...overrides,
  };
}

function createPiHarness() {
  const commands = new Map();
  const sentMessages = [];
  const pi = {
    registerCommand(name, command) {
      commands.set(name, command);
    },
    sendUserMessage(prompt, options) {
      sentMessages.push({ prompt, options });
    },
  };

  return { commands, sentMessages, pi };
}

function createContext({ selectResult } = {}) {
  const notifications = [];
  let selectCalls = 0;
  const ctx = {
    ui: {
      notify(message, level) {
        notifications.push({ message, level });
      },
      async select(_label, _options) {
        selectCalls += 1;
        return selectResult;
      },
    },
  };

  return {
    ctx,
    notifications,
    get selectCalls() {
      return selectCalls;
    },
  };
}

function getCommand(commands, name) {
  const command = commands.get(name);
  assert.ok(command, `${name} should be registered`);
  return command;
}

describe("chronicle:distill", () => {
  it("keeps the no-active-session warning path and does not send a follow-up", async () => {
    const { commands, sentMessages, pi } = createPiHarness();
    registerChronicleDistill(pi, () => undefined);
    const context = createContext();

    await getCommand(commands, "chronicle:distill").handler("", context.ctx);

    assert.deepEqual(context.notifications, [
      { message: "No active session to distill.", level: "warning" },
    ]);
    assert.equal(context.selectCalls, 0);
    assert.equal(sentMessages.length, 0);
  });

  it("warns for an active but empty session and does not send a follow-up", async () => {
    const { commands, sentMessages, pi } = createPiHarness();
    registerChronicleDistill(pi, () => makeSession({ marks: [], beats: [] }));
    const context = createContext();

    await getCommand(commands, "chronicle:distill").handler("", context.ctx);

    assert.deepEqual(context.notifications, [
      { message: "Session has no marks or beats yet. Add some first.", level: "warning" },
    ]);
    assert.equal(context.selectCalls, 0);
    assert.equal(sentMessages.length, 0);
  });

  it("treats a cancelled format selection as a no-op", async () => {
    const { commands, sentMessages, pi } = createPiHarness();
    registerChronicleDistill(pi, () => makeSession());
    const context = createContext({ selectResult: undefined });

    await getCommand(commands, "chronicle:distill").handler("", context.ctx);

    assert.equal(context.selectCalls, 1);
    assert.deepEqual(context.notifications, []);
    assert.equal(sentMessages.length, 0);
  });

  for (const format of DISTILL_FORMATS) {
    it(`sends one ${format} follow-up prompt with the required prompt contract`, async () => {
      const session = makeSession();
      const { commands, sentMessages, pi } = createPiHarness();
      registerChronicleDistill(pi, () => session);
      const context = createContext({ selectResult: format });

      await getCommand(commands, "chronicle:distill").handler("", context.ctx);

      assert.equal(sentMessages.length, 1);
      assert.deepEqual(sentMessages[0].options, { deliverAs: "followUp" });
      assert.deepEqual(context.notifications, [
        { message: `Handed off chronicle distill (${format}) generation.`, level: "info" },
      ]);

      const filename = `chronicle-distill-${format}-${formatFilenameTs(session.startedAt)}.md`;
      const outputPath = join(session.project.progressDir, filename);
      const prompt = sentMessages[0].prompt;

      assert.match(prompt, new RegExp(escapeRegex(outputPath)));
      assert.match(prompt, new RegExp(escapeRegex(filename)));
      assert.match(prompt, new RegExp(escapeRegex(DISTILL_FORMAT_CONTRACTS[format])));
      assert.match(prompt, /Markdown/);
      assert.match(prompt, /セッション名: Sprint distill/);
      assert.match(prompt, /プロジェクトキー: pi-chronicle/);
      assert.match(prompt, new RegExp(escapeRegex(`開始時刻: ${session.startedAt.toLocaleString("ja-JP")}`)));
      assert.match(prompt, /マーク数: 1/);
      assert.match(prompt, /ビート数: 1/);
      assert.match(prompt, /mark — Outlined distill prompt/);
      assert.match(prompt, /beat:decision — Use followUp handoff/);
    });
  }
});

describe("chronicle:novel", () => {
  it("still sends a follow-up to write novel-YYYYMMDD-HHmm.md under the project root", async () => {
    const session = makeSession();
    const { commands, sentMessages, pi } = createPiHarness();
    registerChronicleNovel(pi, () => session);
    const context = createContext();

    await getCommand(commands, "chronicle:novel").handler("", context.ctx);

    assert.equal(sentMessages.length, 1);
    assert.deepEqual(sentMessages[0].options, { deliverAs: "followUp" });
    const filename = `novel-${formatFilenameTs(session.startedAt)}.md`;
    const outputPath = join(session.project.progressDir, "..", filename);
    assert.match(sentMessages[0].prompt, new RegExp(escapeRegex(outputPath)));
    assert.doesNotMatch(sentMessages[0].prompt, /chronicle-distill-/);
    assert.match(sentMessages[0].prompt, /Outlined distill prompt/);
    assert.match(sentMessages[0].prompt, /beat:decision — Use followUp handoff/);
    assert.deepEqual(context.notifications, [
      { message: "Generating novel from chronicle…", level: "info" },
    ]);
  });

  it("still skips empty sessions", async () => {
    const { commands, sentMessages, pi } = createPiHarness();
    registerChronicleNovel(pi, () => makeSession({ marks: [], beats: [] }));
    const context = createContext();

    await getCommand(commands, "chronicle:novel").handler("", context.ctx);

    assert.equal(sentMessages.length, 0);
    assert.deepEqual(context.notifications, [
      { message: "Session has no marks or beats yet. Add some first.", level: "warning" },
    ]);
  });
});

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
