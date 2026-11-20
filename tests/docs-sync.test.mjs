import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const examplesDoc = readFileSync("docs/examples.md", "utf8");
const formatDoc = readFileSync("docs/chronicle-format.md", "utf8");
const releaseDoc = readFileSync("docs/release.md", "utf8");
const roadmap = readFileSync("ROADMAP.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Read the latest published version from the single source of truth in
 * docs/release.md: the recovery-log row marked `(latest)`. Deriving it here
 * keeps the README pin, the release summary line, and the CHANGELOG assertion
 * from each hard-coding their own copy of the version.
 */
function readLatestPublishedVersion(doc) {
  const row = doc.match(/^\|\s*(\d+\.\d+\.\d+)\s*\|[^|\n]*\(latest\)[^|\n]*\|/m);
  assert.ok(
    row,
    "docs/release.md must mark exactly the current npm `latest` row with `(latest)`",
  );
  // Count only table rows, so surrounding prose may mention the marker.
  const flagged = (doc.match(/^\|[^\n]*\(latest\)/gm) ?? []).length;
  assert.equal(
    flagged,
    1,
    `docs/release.md must mark only one row as (latest); found ${flagged}`,
  );
  return row[1];
}

describe("docs sync", () => {
  const publishedVersion = readLatestPublishedVersion(releaseDoc);

  function compareSemver(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i += 1) {
      const delta = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (delta !== 0) return delta;
    }
    return 0;
  }

  it("release doc is parsed into a concrete latest published version", () => {
    assert.match(publishedVersion, /^\d+\.\d+\.\d+$/);
  });

  it("npm latest is never ahead of the repository package version", () => {
    // package.json may be bumped ahead of npm while a release is pending; the
    // published version must never be the newer one, or the checkout is stale.
    assert.ok(
      compareSemver(pkg.version, publishedVersion) >= 0,
      `npm latest ${publishedVersion} is newer than package.json ${pkg.version}; the repository is behind the published release`,
    );
  });

  it("README pinned install example matches the latest published version", () => {
    const pinExample = `pi install npm:pi-chronicle@${publishedVersion}`;
    assert.match(
      readme,
      new RegExp(pinExample.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `README should include pinned install example: ${pinExample}`,
    );
  });

  it("README pins no unpublished or stale version in its install examples", () => {
    const pins = [...readme.matchAll(/pi install npm:pi-chronicle@([^\s`]+)/g)];
    assert.ok(pins.length > 0, "README should keep a pinned install example");
    for (const pin of pins) {
      assert.equal(
        pin[1],
        publishedVersion,
        `README pin ${pin[1]} should be the latest published version ${publishedVersion}`,
      );
    }
  });

  it("release doc current line matches the latest published version", () => {
    const currentLine =
      `Current published release line is \`${publishedVersion}\`: npm \`latest\` is \`${publishedVersion}\``;
    assert.match(
      releaseDoc,
      new RegExp(
        `^${currentLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "m",
      ),
      `docs/release.md should document the latest published npm version: ${currentLine}`,
    );
  });

  describe("latest-version derivation rejects drift fixtures", () => {
    it("fails when no row is marked (latest)", () => {
      assert.throws(
        () => readLatestPublishedVersion("| 0.3.9 | yes | yes | no marker |\n"),
        /must mark exactly the current npm `latest` row/,
      );
    });

    it("fails when two rows are marked (latest)", () => {
      const doc =
        "| 0.2.0 | yes (latest) | yes | old |\n| 0.3.10 | yes (latest) | yes | new |\n";
      assert.throws(
        () => readLatestPublishedVersion(doc),
        /must mark only one row as \(latest\); found 2/,
      );
    });

    it("derives the marked row and not the highest version number", () => {
      const doc =
        "| 0.3.10 | yes | yes | unpublished-at-the-time row |\n| 0.3.9 | yes (latest) | yes | published row |\n";
      assert.equal(readLatestPublishedVersion(doc), "0.3.9");
    });
  });

  it("ROADMAP release status names the current package version", () => {
    assert.match(
      roadmap,
      new RegExp(
        `^- Repository package version at this refresh: \\*\\*v${escapeRegExp(pkg.version)}\\*\\*`,
        "m",
      ),
      `ROADMAP.md current release status should name ${pkg.version}`,
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

  it("chronicle format doc records the renderer contract", () => {
    assert.match(formatDoc, /## Markdown structure/);
    assert.match(formatDoc, /## Marks[\s\S]*## Beats[\s\S]*## Closing/);
    assert.match(formatDoc, /`## Marks` and `## Beats` are always emitted/);
    assert.match(formatDoc, /does not create links or escape labels/);
    assert.match(formatDoc, /`## Closing` is written only when `\/chronicle:end` receives a non-empty closing note\./);
    assert.match(formatDoc, /`\/chronicle:export` never writes it\./);
  });

  it("examples doc documents detected, vault, and outside-vault output locations", () => {
    assert.match(examplesDoc, /## Project output locations/);
    assert.match(examplesDoc, /4_Project\/<key>/);
    assert.match(examplesDoc, /● scratch/);
    assert.match(examplesDoc, /<cwd>\/Progress\/chronicle-YYYYMMDD-HHmm\.md/);
    assert.match(
      readme,
      /docs\/examples\.md#project-output-locations/,
      "README should link to the project output locations example",
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
