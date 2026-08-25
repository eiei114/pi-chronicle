import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const releaseDoc = readFileSync("docs/release.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");

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
    const currentLine =
      `Current release line is reconciled: npm \`latest\` is \`${pkg.version}\``;
    assert.match(
      releaseDoc,
      new RegExp(
        `^${currentLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "m",
      ),
      `docs/release.md should document reconciled npm latest: ${currentLine}`,
    );
  });

  it("CHANGELOG has a dated section for the current package version", () => {
    const heading = new RegExp(
      `^## \\[${pkg.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\] - \\d{4}-\\d{2}-\\d{2}$`,
      "m",
    );
    assert.match(
      changelog,
      heading,
      `CHANGELOG.md should include a dated release section for ${pkg.version}`,
    );
  });

  it("CHANGELOG current version section has no duplicate Changed headings", () => {
    const versionSection = changelog.match(
      new RegExp(
        `^## \\[${pkg.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\][\\s\\S]*?(?=^## \\[\\d|$)`,
        "m",
      ),
    )?.[0];
    assert.ok(versionSection, `CHANGELOG section for ${pkg.version} should exist`);
    const changedHeadings = (versionSection.match(/^### Changed$/gm) ?? []).length;
    assert.ok(
      changedHeadings <= 1,
      `CHANGELOG ${pkg.version} should have at most one ### Changed heading (found ${changedHeadings})`,
    );
  });

  it("CHANGELOG current version section does not reference an older bump target", () => {
    const versionSection = changelog.match(
      new RegExp(
        `^## \\[${pkg.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\][\\s\\S]*?(?=^## \\[\\d|$)`,
        "m",
      ),
    )?.[0];
    assert.ok(versionSection, `CHANGELOG section for ${pkg.version} should exist`);
    assert.doesNotMatch(
      versionSection,
      /Bump package version to `\d+\.\d+\.\d+`/,
      "CHANGELOG should not carry stale version-bump placeholder text",
    );
  });
});
