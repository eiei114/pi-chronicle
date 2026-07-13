# Release

This package uses npm Trusted Publishing with GitHub Actions OIDC.

Do not add `NPM_TOKEN` or long-lived npm tokens to GitHub Secrets.

## One-time npm setup

On npmjs.com, configure Trusted Publishing for this package:

- Publisher: GitHub Actions
- Repository: this GitHub repository
- Workflow filename: `publish.yml`

## Publish

```bash
npm version patch
git push
```

On `main`, `.github/workflows/auto-release.yml` checks `package.json` version. If `v<version>` does not exist yet, it creates the tag, creates the GitHub Release, then explicitly dispatches `.github/workflows/publish.yml` for that tag. This `workflow_dispatch` handoff is the **authoritative** npm publish trigger for normal releases.

`publish.yml` also runs when:

- a `v*.*.*` tag is pushed manually (outside auto-release)
- a GitHub Release is published
- a maintainer triggers `workflow_dispatch` from GitHub Actions

`publish.yml` does **not** run on ordinary `main` pushes. Non-release merges therefore do not create misleading red publish failures when `package.json` or lockfiles change without a version bump.

The workflow skips `name@version` if that exact package version already exists on npm.

## Workflow guardrail

Do not ship a new Pi OSS package or version bump with only `package.json` changes.
The repository must include the release workflow pair:

- `.github/workflows/auto-release.yml` creates `v<version>` tags and GitHub Releases from `main` version bumps.
- `.github/workflows/publish.yml` publishes to npm through Trusted Publishing.

Important: tags or releases created by `GITHUB_TOKEN` do not reliably fan out into another workflow through normal `push.tags` or `release.published` triggers. The template keeps publishing reliable by having `auto-release.yml` explicitly dispatch `publish.yml` after creating the tag/release. If you change the release flow, keep one explicit handoff path: `workflow_dispatch` from auto-release, `repository_dispatch`, or `workflow_run` on the auto-release workflow.

## GitHub Actions requirements

- `permissions: id-token: write`
- `permissions: actions: write` on auto-release so it can dispatch `publish.yml`
- `auto-release.yml` must call `gh workflow run publish.yml --ref "$TAG" -f ref="$TAG"`, or `publish.yml` must have an equivalent explicit handoff trigger such as `workflow_run`
- GitHub-hosted runner
- Node.js 24, so the release job uses a current npm CLI for Trusted Publishing
- No `NPM_TOKEN` and no `registry-url` in `setup-node` (that would write a conflicting `.npmrc` and break OIDC Trusted Publishing)
- `npm publish --provenance --access public` from the configured workflow file

## First release checklist

- [ ] `package.json` name is final
- [ ] `repository.url` points to the real GitHub repository
- [ ] npm Trusted Publisher is configured
- [ ] `npm run ci` passes
- [ ] `npm pack --dry-run` contains only intended files
- [ ] CHANGELOG.md has the release date

## Registry drift recovery

Use this when a GitHub Release exists but npm publish failed, or when npm `latest` lags `package.json` on `main`.

### Verify current state

```bash
npm run release:sync-check

# Manual spot checks
npm view pi-chronicle version
npm view pi-chronicle versions --json
gh release list --repo eiei114/pi-chronicle --limit 10
```

`release:sync-check` fails when npm `latest` does not match `package.json`. It warns (without failing) when older GitHub releases are missing on npm but `latest` is correct — common after a failed intermediate publish that was later superseded.

### Recover a missed publish for an existing tag

1. Confirm Trusted Publishing is working (see DOT-493 root cause: no `registry-url` in `setup-node`).
2. In GitHub Actions, run **Publish to npm** → `workflow_dispatch` with `ref` set to the tag (for example `v0.1.1`).
3. If a **newer** version is already on npm `latest`, backfill with a non-`latest` dist-tag:

```bash
# Example: 0.1.2 is already latest; backfill 0.1.1 for semver completeness
gh workflow run publish.yml --repo eiei114/pi-chronicle --ref v0.1.1 -f ref=v0.1.1
# If the workflow does not support dist-tag yet, publish locally with OIDC/provenance
# or add a dist_tag workflow_dispatch input before retrying.
```

npm rejects applying `latest` to an older version when a higher version is already published. That is expected — use `--tag=<name>` for historical backfill, or skip backfill when the newer release supersedes the gap.

### pi-chronicle recovery log

| Version | GitHub Release | npm | Notes |
|---------|----------------|-----|-------|
| 0.1.0   | yes            | yes | Initial manual publish |
| 0.1.1   | yes            | no  | Jun 6: OIDC `E404` (run [27048699054](https://github.com/eiei114/pi-chronicle/actions/runs/27048699054)); Jul 4 backfill: dist-tag / ordering rejection (run [28700780370](https://github.com/eiei114/pi-chronicle/actions/runs/28700780370)) |
| 0.1.2   | yes            | yes | Repaired Trusted Publishing (PR #11, run [28681676539](https://github.com/eiei114/pi-chronicle/actions/runs/28681676539)) |
| 0.1.3   | yes (latest)   | yes (`latest`) | Normal release (run [28704531012](https://github.com/eiei114/pi-chronicle/actions/runs/28704531012)) |

Current release line is reconciled: npm `latest` is `0.1.3`, matching `package.json` and the latest GitHub Release. Gap at `0.1.1` is documented; optional backfill only if semver completeness is required (non-`latest` dist-tag).

Full investigation for run 28700780370: [docs/investigations/failed-npm-publish-run-2026-07-04.md](./investigations/failed-npm-publish-run-2026-07-04.md).

