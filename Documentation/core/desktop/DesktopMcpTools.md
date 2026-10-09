# DesktopMcpTools

`core/desktop/DesktopMcpTools.js`

MCP controller for the `desktop_*` tools (source `core.desktop`): the tool
definitions and a handler that routes each call to DesktopService and shapes
the reply. Registered with the MCP aggregator; the in-app agent sees them as one
lazy "Desktop control" group.

## Members

- `DesktopMcpTools.TOOLS` the definitions. Tools that send real input are
  `mutating: true` (`desktop_click`, `_type`, `_drag`, `_set_value`,
  `_press_key`, `_scroll`, `_focus`), so the chat's approval gate asks first;
  `desktop_list_windows`, `_observe`, `_screenshot` are not.
- `DesktopMcpTools.WINDOW` the shared `hwnd` / `window` properties.
- `new DesktopMcpTools(desktopService)`; `handler()` the `(name, args)` function
  for the aggregator; `handle(name, args)` the same as a method.

## Routes

`desktop_list_windows` -> `listWindows()`, `desktop_observe` -> `observe(args)`
(reply: the observation text only), `desktop_screenshot` -> `screenshot(args)`
(reply: a PNG image part plus `Screenshot of <title>: <w>x<h> px (hwnd <n>); desktop_click x/y use these pixels.`),
`desktop_click` -> `click`, `desktop_type` -> `type`, `desktop_drag` -> `drag`,
`desktop_set_value` -> `setValue`, `desktop_press_key` -> `pressKey`,
`desktop_scroll` -> `scroll`, `desktop_focus` -> `focus`.

Success replies `McpResult.text({ success: true, data })`. A failure with a
`code` (HUMAN_NEEDED, COVERED) replies `{ success: false, error, code }` as an
error so the agent can branch on the code; other failures, throws and unknown
tools reply `McpResult.error`.
