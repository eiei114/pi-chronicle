# Pi SDK 1.1.0 compatibility

`pi-chronicle` is typechecked and behavior-smoked against the frozen SDK wave:

- `@earendil-works/pi-agent-core`: `1.1.0`
- `@earendil-works/pi-ai`: `1.1.0`
- `@earendil-works/pi-coding-agent`: `1.1.0`
- `@earendil-works/pi-tui`: `1.1.0`

These exact versions are development/test pins. Public peer dependencies remain
wildcard ranges so consumers retain control of their Pi host version.

The extension surface used here remains supported: `ExtensionAPI`,
`ExtensionCommandContext`, `pi.registerCommand`, `pi.on("session_start", ...)`,
`pi.events.emit`, and `ctx.ui.notify` / `setStatus` / `input` / `select`. The
verified 1.1.0 migration guidance for these APIs requires no replacement or
behavior change in `pi-chronicle`. Keep checking the SDK's upstream migration
notes when adding or changing APIs; do not infer replacements from deprecation
warnings in unrelated packages.

The [upstream 1.1.0 changelog](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/CHANGELOG.md)
does not deprecate or remove the extension APIs listed above. Its TypeBox 1.x
migration notes call out removed legacy aliases such as `Type.Base` and
`Type.Promise`; `pi-chronicle` does not use those aliases. The current extension
contracts are documented in the [upstream extension guide](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/extensions.md).

Run `npm run smoke:pi` for a real, local Pi RPC host check. It loads this package
through the pinned CLI, checks actual session-start registration and the
`/chronicle:status` feature response, verifies the handled empty-export warning
without creating project files, starts a second host to verify reload and clean
shutdown, and launches the pinned CLI through the native host shell. It runs
offline with tools disabled and a temporary Pi config/project directory; no
provider inference or global Pi settings are used. The host, extension loader,
RPC lifecycle, and package feature paths are real, not mocked. The committed
observations are in `docs/verification/pi-sdk-smoke.json`; CI runs the harness
on Linux and Windows.
