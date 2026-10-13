import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const releaseWorkflow = readFileSync(
  new URL("../.github/workflows/auto-release.yml", import.meta.url),
  "utf8",
);
const stableSemverMatch = releaseWorkflow.match(
  /STABLE_SEMVER_REGEX='([^']+)'/,
);

test("manual release validates stable SemVer against the latest stable tag", () => {
  assert.ok(stableSemverMatch, "workflow must define stable SemVer validation");
  assert.match(releaseWorkflow, /on:\s+workflow_dispatch:/);
  assert.match(
    releaseWorkflow,
    /if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/,
  );
  assert.doesNotMatch(releaseWorkflow, /^\s*(?:push|pull_request):/m);
  assert.match(
    releaseWorkflow,
    /\[\[ ! "\$CURRENT_VERSION" =~ \$STABLE_SEMVER_REGEX \]\]/,
  );
  assert.match(
    releaseWorkflow,
    /\[\[ "\$version" =~ \$STABLE_SEMVER_REGEX \]\]/,
  );
  assert.match(
    releaseWorkflow,
    /git tag --list 'v\[0-9\]\*' --sort=-version:refname/,
  );
  assert.match(releaseWorkflow, /BEFORE=\$\(git rev-list -n 1 "\$PREVIOUS_TAG"\)/);
  assert.doesNotMatch(releaseWorkflow, /github\.event\.before/);

  const stableSemver = new RegExp(stableSemverMatch[1]);
  for (const version of ["0.0.0", "1.2.3", "10.20.30"]) {
    assert.match(version, stableSemver);
  }
  for (const version of ["01.2.3", "1.02.3", "1.2.03", "1.2", "1.2.3-rc.1"]) {
    assert.doesNotMatch(version, stableSemver);
  }
});
