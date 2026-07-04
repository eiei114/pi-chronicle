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

