# Pi SDK 1.2.0 compatibility

`pi-chronicle` is typechecked and behavior-smoked against these exact
development/test SDK pins:

- `@earendil-works/pi-agent-core`: `1.2.0`
- `@earendil-works/pi-ai`: `1.2.0`
- `@earendil-works/pi-coding-agent`: `1.2.0`
- `@earendil-works/pi-tui`: `1.2.0`

These exact versions are development/test pins. Public peer dependency ranges
remain `*`, so consumers retain control of their Pi host version.

The extension APIs used by this package—`ExtensionAPI`,
`ExtensionCommandContext`, `pi.registerCommand`,
`pi.on("session_start", ...)`, `pi.sendUserMessage`, and the `ctx.ui`
notification, status, input, and select methods—typecheck and load on 1.2.0.
No deprecated or removed API used by `pi-chronicle` needs replacement for this
upgrade.

The [upstream Pi v1.2.0 release notes](https://github.com/earendil-works/pi/releases/tag/v1.2.0)
change `before_agent_start`: `BeforeAgentStartEvent` is now a `messageType`
union (`user` events have `prompt` and `images`; `custom` events have `message`
and no `prompt`). A handler that reads user-only fields must narrow on
`event.messageType === "user"`. `pi-chronicle` does not subscribe to this event,
so no migration is needed. The release also notes startup-session busy state
and requires `deliverAs` for `sendUserMessage()` during startup; this package
uses `deliverAs: "followUp"` in its follow-up commands, outside a startup
handler. Configuration schema/theme changes do not affect this extension.

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
