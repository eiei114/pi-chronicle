import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const releaseDoc = readFileSync("docs/release.md", "utf8");

describe("docs sync", () => {
  it("README pinned install example matches package.json version", () => {
    const pinExample = `pi install npm:pi-chronicle@${pkg.version}`;
    assert.match(
      readme,
      new RegExp(pinExample.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `README should include pinned install example: ${pinExample}`,
    );
  });

  it("release doc current line matches package.json version", () => {
    const currentLine = `npm \`latest\` is \`${pkg.version}\``;
    assert.match(
      releaseDoc,
      new RegExp(currentLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `docs/release.md should document reconciled npm latest: ${currentLine}`,
    );
  });
});
