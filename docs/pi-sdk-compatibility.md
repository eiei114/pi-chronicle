# Pi SDK 1.5.0 compatibility

`pi-chronicle` is typechecked and behavior-smoked against these exact
development/test SDK pins:

- `@earendil-works/pi-agent-core`: `1.5.0`
- `@earendil-works/pi-ai`: `1.5.0`
- `@earendil-works/pi-coding-agent`: `1.5.0`
- `@earendil-works/pi-tui`: `1.5.0`

These exact versions are development/test pins. Public peer dependency ranges
remain `*`, so consumers retain control of their Pi host version.

The extension APIs used by this package—`ExtensionAPI`,
`ExtensionCommandContext`, `pi.registerCommand`,
`pi.on("session_start", ...)`, `pi.sendUserMessage`, and the `ctx.ui`
notification, status, input, and select methods—typecheck and load on 1.5.0.
The upstream v1.2.0 release changed `before_agent_start` events to a
`messageType` union (`user` events have `prompt` and `images`; `custom` events
have `message` and no `prompt`) and requires `deliverAs` for startup
`sendUserMessage()` calls. This package does not subscribe to
`before_agent_start`; its follow-up commands explicitly use
`deliverAs: "followUp"`, outside startup handlers.

The v1.5.0 release moves tool argument validation to `@earendil-works/pi-schema`,
so TypeBox-only features such as `Type.Refine()`, `Type.BigInt()`,
`Type.Undefined()`, codecs, and custom `Format.Set()` formats no longer affect
tool arguments. `pi-chronicle` registers commands only: it has no tool argument
schemas or TypeBox imports, so this migration does not affect it. The release
also changes `pi-ai`'s TypeBox compatibility exports; this package does not
import `Type`, `Static`, or `TSchema` from `pi-ai`. Reviewed the upstream
[Pi v1.2.0](https://github.com/earendil-works/pi/releases/tag/v1.2.0),
[v1.3.0](https://github.com/earendil-works/pi/releases/tag/v1.3.0),
[v1.4.0](https://github.com/earendil-works/pi/releases/tag/v1.4.0), and
[v1.5.0](https://github.com/earendil-works/pi/releases/tag/v1.5.0) release
notes; no deprecated or removed API used by this package needs replacement.

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
