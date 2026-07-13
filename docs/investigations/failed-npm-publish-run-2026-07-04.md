# Investigation: failed npm publish run 28700780370

**Date investigated:** 2026-07-13  
**Multica issue:** DOT-883 (`6fd13d1c-72f4-4297-82e0-5bd24a4fbb12`)  
**Scope:** evidence and safe correction options only — no workflow edits, publish, version bump, or changelog change in this slice.

## Failed run summary

| Field | Value |
|-------|-------|
| Run URL | https://github.com/eiei114/pi-chronicle/actions/runs/28700780370 |
| Workflow | `Publish to npm` (`.github/workflows/publish.yml`) |
| Trigger | `workflow_dispatch` (manual recovery backfill) |
| Ref / branch | `v0.1.1` |
| Commit SHA | `03522981a679a09189a40eb3b0aacdc4f76f9416` |
| Package version | `0.1.1` |
| Job conclusion | **failure** on step **Publish to npm** (steps 1–7 succeeded) |
| Run time (UTC) | 2026-07-04T08:38:54Z |

Earlier related failures for context (not the primary run under review):

| Run | Date (UTC) | Ref | Error class |
|-----|------------|-----|-------------|
| [27048699054](https://github.com/eiei114/pi-chronicle/actions/runs/27048699054) | 2026-06-06 | `v0.1.1` | Trusted Publishing / authentication (`E404` on `PUT`) |
| [28288534664](https://github.com/eiei114/pi-chronicle/actions/runs/28288534664) | 2026-06-27 | `v0.1.2` | Trusted Publishing / authentication (`E404` on `PUT`) |
| [28681676539](https://github.com/eiei114/pi-chronicle/actions/runs/28681676539) | 2026-07-03 | `main` | **success** — OIDC repair landed (PR #11) |
| [28704531012](https://github.com/eiei114/pi-chronicle/actions/runs/28704531012) | 2026-07-04 | `v0.1.3` | **success** — current release line |

## npm public state (2026-07-13)

```bash
$ npm view pi-chronicle versions --json
["0.1.0", "0.1.2", "0.1.3"]

$ npm view pi-chronicle dist-tags --json
{ "latest": "0.1.3" }

$ npm view pi-chronicle@0.1.1 version
npm error code E404   # version never published
```

| Version | GitHub Release | npm registry | Notes |
|---------|----------------|--------------|-------|
| 0.1.0 | yes | yes | Initial publish |
| 0.1.1 | yes | **no** | First attempt failed (OIDC, Jun 6); Jul 4 backfill failed (see below) |
| 0.1.2 | yes | yes | Published after OIDC fix |
| 0.1.3 | yes (latest) | yes (`latest`) | Normal release line reconciled |

`npm run release:sync-check` on `main` (package.json `0.1.3`): **OK** for latest alignment; **WARN** for optional gap versions `0.1.1` and `0.0.0` missing on npm but older than `latest`.

## Failure output (run 28700780370)

The publish step reached npm registry upload with OIDC working (tarball built, provenance path active). npm rejected the implicit `latest` dist-tag assignment:

```text
npm error Cannot implicitly apply the "latest" tag because previously published version 0.1.2 is higher than the new version 0.1.1. You must specify a tag using --tag.
```

Full log: Actions run → job **Publish package** → step **Publish to npm**.

## Cause classification

**Primary (run 28700780370): version ordering / dist-tag constraint** — not duplicate-version (exact `0.1.1` was never on npm), not Trusted Publishing failure (auth and upload path succeeded), not trigger misconfiguration (`workflow_dispatch` with `ref=v0.1.1` behaved as designed).

**Contributing workflow behavior:** the **Skip already published version** step only checks whether the *exact* `name@version` exists (`npm view pi-chronicle@0.1.1`). On `E404` it sets `skip=false` and proceeds to `npm publish --provenance --access public` without a custom dist-tag. npm then refuses to attach `latest` when a higher semver is already published.

**Historical root cause for the gap:** earlier `v0.1.1` attempts failed with `E404 Not Found - PUT` before Trusted Publishing was repaired (see run 27048699054). Maintainers later published `0.1.2` and `0.1.3`, leaving `0.1.1` as an optional backfill gap.

## Current workflow behavior (unchanged in this issue)

From `.github/workflows/publish.yml` at investigation time:

1. Checkout `ref` input or triggering ref.
2. `npm ci` + `npm run ci` validation.
3. Skip only when `npm view name@version` returns the same version (exact duplicate).
4. Otherwise `npm publish --provenance --access public` (implicit `latest` tag).

`workflow_dispatch` is documented in `docs/release.md` as the recovery path for missed publishes. It does not accept a `dist-tag` input today.

## Reproducible non-publish check

Run from repository root. **Does not publish** to npm.

```bash
# 1. Local package integrity
npm run ci

# 2. Registry / GitHub drift (warns on 0.1.1 gap, fails only if latest != package.json)
npm run release:sync-check

# 3. Confirm 0.1.1 is absent on npm (expect non-zero exit / E404)
npm view pi-chronicle@0.1.1 version

# 4. Confirm latest is newer than the backfill target
npm view pi-chronicle dist-tags.latest

# 5. Simulate the workflow skip step for v0.1.1 (read-only)
name=$(node -p "require('./package.json').name")
version=0.1.1
set +e
output=$(npm view "${name}@${version}" version 2>&1)
status=$?
set -e
if [ "$status" -eq 0 ]; then echo "skip=true (already published)"; \
elif printf '%s' "$output" | grep -Eq 'E404|404 Not Found|404 No match'; then \
  echo "skip=false (would attempt publish)"; \
else
  printf '%s\n' "$output" >&2
  exit "$status"
fi

# 6. Semver guard: backfill would need a non-latest tag
node --input-type=module -e "
const target = '0.1.1';
const res = await fetch('https://registry.npmjs.org/pi-chronicle');
const { 'dist-tags': tags } = await res.json();
const latest = tags.latest;
const cmp = (a,b) => a.split('.').map(Number).reduce((r,n,i)=>r||n-(b.split('.').map(Number)[i]??0),0);
console.log('target', target, 'latest', latest, 'older_than_latest', cmp(target, latest) < 0);
"
```

**Expected results today:** steps 1–2 pass on `main`; step 3 exits with E404; step 4 prints `0.1.3`; step 5 prints `skip=false`; step 6 prints `older_than_latest true` — matching the Jul 4 failure mode without invoking `npm publish`.

## Minimal safe correction options

Choose one in a **separate correction issue** (human-approved; out of scope here):

1. **Accept the gap (recommended default).** `0.1.3` is `latest`; installs use `npm install pi-chronicle@latest`. Missing `0.1.1` does not block users. No registry or workflow change.

2. **Backfill `0.1.1` with a non-`latest` dist-tag.** Requires `npm publish --tag=<name>` (e.g. `backfill-0.1.1`). Smallest workflow change: add optional `dist_tag` `workflow_dispatch` input and pass `--tag` when set. **Human must run** after workflow change; do not republish as `latest`.

3. **Harden skip logic before publish.** Extend the skip step to detect `version < npm dist-tags.latest` and either skip with a clear log message or require an explicit backfill tag input. Prevents noisy red runs on recovery retries.

4. **Do not retry `workflow_dispatch` on `v0.1.1` without option 2 or 3.** Re-running today would fail the same way while `latest` remains `0.1.3`.

## Evidence checklist (acceptance)

- [x] Failed run, trigger/ref, package version, and npm public state recorded with evidence
- [x] Cause classified: **version ordering / dist-tag constraint** (with historical OIDC context documented)
- [x] Reproducible non-publish check and minimal safe correction options documented
- [x] No release workflow, package version, changelog, registry, or publish action taken in this slice
