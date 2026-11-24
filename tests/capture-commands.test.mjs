import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerChronicleBeat } from "../extensions/chronicle-beat.ts";
import { registerChronicleMark } from "../extensions/chronicle-mark.ts";
import { BEAT_TYPE_LABELS } from "../lib/session.ts";

function createHarness({ selectedType, label } = {}) {
  const session = {
    name: "capture-test",
    project: { key: "pi-chronicle", progressDir: "unused" },
    startedAt: new Date("2026-09-07T11:30:00Z"),
    marks: [],
    beats: [],
  };
  const commands = new Map();
  const pi = {
    registerCommand(name, command) {
      commands.set(name, command);
    },
  };
  registerChronicleMark(pi, () => session);
  registerChronicleBeat(pi, () => session);

  const prompts = [];
  const footerUpdates = [];
  const ctx = {
    ui: {
      async select(prompt, options) {
        prompts.push(prompt);
        if (selectedType !== undefined) {
          assert.ok(options.includes(selectedType), "selected display label should be offered");
        }
        return selectedType;
      },
      async input(prompt) {
        prompts.push(prompt);
        return label;
      },
      setStatus(key, text) {
        footerUpdates.push([key, text]);
      },
      notify() {},
    },
  };

  return {
    session,
    prompts,
    footerUpdates,
    async run(name) {
      const command = commands.get(name);
      assert.ok(command, `${name} should be registered`);
      await command.handler("", ctx);
    },
  };
}

describe("Chronicle capture commands", () => {
  it("saves trimmed labels, maps a beat display label to its type, and refreshes counts", async () => {
    const { session, prompts, footerUpdates, run } = createHarness({
      selectedType: BEAT_TYPE_LABELS.milestone,
      label: " \tCapture complete  ",
    });

    await run("chronicle:mark");
    assert.deepEqual(session.marks.map(({ label }) => label), ["Capture complete"]);
    assert.deepEqual(session.beats, []);
    assert.deepEqual(footerUpdates, [["chronicle", "● pi-chronicle · 1m 0b"]]);

    await run("chronicle:beat");
    assert.deepEqual(session.beats.map(({ type, label }) => ({ type, label })), [
      { type: "milestone", label: "Capture complete" },
    ]);
    assert.deepEqual(session.marks.map(({ label }) => label), ["Capture complete"]);
    assert.deepEqual(prompts, ["Mark label:", "Beat type:", "Label:"]);
    assert.deepEqual(footerUpdates, [
      ["chronicle", "● pi-chronicle · 1m 0b"],
      ["chronicle", "● pi-chronicle · 1m 1b"],
    ]);
  });

  it("skips label input and leaves the session and footer untouched when beat selection is canceled", async () => {
    const { session, prompts, footerUpdates, run } = createHarness({
      label: "Should not be requested",
    });
    const before = structuredClone(session);

    await run("chronicle:beat");

    assert.deepEqual(prompts, ["Beat type:"]);
    assert.deepEqual(session, before);
    assert.deepEqual(footerUpdates, []);
  });

  for (const [name, label] of [["canceled", undefined], ["whitespace-only", " \t\n "]]) {
    for (const [command, expectedPrompts] of [
      ["chronicle:mark", ["Mark label:"]],
      ["chronicle:beat", ["Beat type:", "Label:"]],
    ]) {
      it(`leaves the session and footer untouched for a ${name} ${command} label`, async () => {
        const { session, prompts, footerUpdates, run } = createHarness({
          selectedType: BEAT_TYPE_LABELS.blocker,
          label,
        });
        const before = structuredClone(session);

        await run(command);

        assert.deepEqual(prompts, expectedPrompts);
        assert.deepEqual(session, before);
        assert.deepEqual(footerUpdates, []);
      });
    }
  }
});
