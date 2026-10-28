# DesktopCallRisk

`core/llm-server/chat/approval/DesktopCallRisk.js`

The desktop calls that ask every time, even under a carried "allow desktop
control" grant: typing or setting a value into a password field, any input into
a window titled like a checkout, payment or bank, and launching such a URL. Read
by [ApprovalCheck](../bridge/tools/ApprovalCheck.md) through the assessor
[BridgeRun](../bridge/BridgeRun.md) builds over
[BridgeGlobals](../bridge/BridgeGlobals.md)`.desktopService()`.

## Methods (all static)

- `assess(name, params, desktop)` -> `{ reason }` or null. `desktop` is a
  [DesktopService](../../../desktop/DesktopService.md) (or null: nothing is
  sensitive). `desktop_type` and `desktop_set_value` with a `ref` whose node in
  the last `desktop_observe` of that window has `password` (UI Automation's
  `IsPassword`) -> `a password field`. `desktop_launch` whose app or args match
  `SENSITIVE_PLACE` -> `a payment or banking page`. Any other input tool
  (`INPUT`) on a window (by `window` text, or `hwnd` resolved to its title; the
  whole desktop is never one) whose title matches -> `a payment or banking
  window, "<title>"`. Screenshots, observe and focus are never sensitive.
- `assessor(getDesktop)` -> `(name, params) => { reason } | null`, reading the
  service per call and swallowing every throw.
- `SENSITIVE_PLACE`: checkout, payment(s), billing, pay now, place (your)
  order, purchase, credit or debit card, card number, bank(ing), wallet, wire
  transfer, send money.

## Why

The research behind the agent-run feature: users want approval for anything
touching credentials or payments without approving every click. These two
signals are cheap and catch the common cases; a false positive costs one extra
question, a miss leaves the ordinary grant in place. Typing without a ref (into
whatever has focus) is not read, so the model is told in `desktop_observe`'s
digest which fields are password fields.
