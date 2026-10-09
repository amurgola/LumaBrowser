# DesktopError

`core/desktop/DesktopError.js`

An `Error` with a machine-readable `code`, so the agent can branch on why desktop
control stopped, plus the failure-result shape every desktop action returns.

## Members

- `new DesktopError(message, code)`.
- `DesktopError.HUMAN_NEEDED` only the person at the machine can proceed (UAC,
  sign-in prompt, lock screen, secure desktop).
- `DesktopError.COVERED` a ref's element is hidden under something else at click time.
- `DesktopError.REFUSED` anti-cheat or elevated target.
- `DesktopError.toResult(error)` `{ success: false, error: message, code? }` from
  any thrown value; `code` only when the error has one.

[DesktopMcpTools](DesktopMcpTools.md) keeps `code` in the tool payload.
