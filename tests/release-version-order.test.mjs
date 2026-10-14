import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/auto-release.yml", import.meta.url), "utf8");

test("release refuses a version that is not newer than the last released version", () => {
  // The equality-only check is not enough: a lower but different version would
  // otherwise create an out-of-order tag and release.
  assert.match(workflow, /Refusing to release/, "must fail closed on a downgrade");
  assert.match(workflow, /parse\(process\.argv\[1\]\)/, "must compare version components");
  assert.match(workflow, /HIGHER"\s*!=\s*"yes"/, "must branch on the semantic comparison");
});

test("an equal or lower version never sets released=true", () => {
  const equal = workflow.indexOf('if [ "$CURRENT_VERSION" = "$PREVIOUS_VERSION" ]');
  const downgrade = workflow.indexOf('Refusing to release');
  const released = workflow.indexOf('echo "released=true"');
  assert.ok(equal >= 0 && downgrade > equal && released > downgrade);
});
