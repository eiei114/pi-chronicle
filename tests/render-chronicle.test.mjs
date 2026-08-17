import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderChronicle } from "../lib/render-chronicle.ts";
import { formatTime } from "../extensions/chronicle-core.ts";

function makeSession(overrides = {}) {
  return {
    name: "2026-08-17",
    project: { key: "test", progressDir: "/tmp/Progress" },
    startedAt: new Date(2026, 7, 17, 10, 30),
    marks: [],
    beats: [],
    ...overrides,
  };
}

describe("renderChronicle", () => {
  it("renders the chronicle heading and started/ended timestamps", () => {
    const startedAt = new Date(2026, 7, 17, 10, 30);
    const endedAt = new Date(2026, 7, 17, 12, 45);
    const md = renderChronicle(makeSession({ name: "2026-08-17", startedAt }), endedAt);

    assert.match(md, /^# Chronicle — 2026-08-17\n/);
    assert.match(md, /started: 2026-08-17 10:30/);
    assert.match(md, /ended: 2026-08-17 12:45/);
  });

  it("renders empty marks and beats sections", () => {
    const md = renderChronicle(
      makeSession(),
      new Date(2026, 7, 17, 11, 0),
    );

    assert.match(md, /## Marks\n\n/);
    assert.match(md, /## Beats\n$/);
    assert.doesNotMatch(md, /## Closing/);
  });

  it("renders mark entries with localized times", () => {
    const markTime = new Date(2026, 7, 17, 9, 15);
    const md = renderChronicle(
      makeSession({
        marks: [{ time: markTime, label: "Started refactor" }],
      }),
      new Date(2026, 7, 17, 11, 0),
    );

    assert.match(
      md,
      new RegExp(`- ${formatTime(markTime).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — Started refactor`),
    );
  });

  it("renders beat entries with type and label", () => {
    const beatTime = new Date(2026, 7, 17, 10, 5);
    const md = renderChronicle(
      makeSession({
        beats: [{ time: beatTime, type: "decision", label: "Use lib module" }],
      }),
      new Date(2026, 7, 17, 11, 0),
    );

    assert.match(
      md,
      new RegExp(
        `### ${formatTime(beatTime).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} · decision · Use lib module`,
      ),
    );
    assert.match(md, /## Beats\n### /);
  });

  it("renders an optional closing note section", () => {
    const md = renderChronicle(
      makeSession(),
      new Date(2026, 7, 17, 11, 0),
      "Shipped markdown coverage",
    );

    assert.match(md, /## Closing\nShipped markdown coverage\n/);
  });

  it("omits the closing section when no note is provided", () => {
    const md = renderChronicle(
      makeSession(),
      new Date(2026, 7, 17, 11, 0),
      undefined,
    );

    assert.doesNotMatch(md, /## Closing/);
  });
});
