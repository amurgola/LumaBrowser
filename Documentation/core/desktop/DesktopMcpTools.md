# DesktopMcpTools

`core/desktop/DesktopMcpTools.js`

MCP controller for the `desktop_*` tools (source `core.desktop`): the tool
definitions and a handler that routes each call to DesktopService and shapes
the reply. Registered with the MCP aggregator; the in-app agent sees them as one
lazy "Desktop control" group.

## Members

- `DesktopMcpTools.TOOLS` the definitions. Tools that send real input are
  `mutating: true` (`desktop_click`, `_type`, `_drag`, `_set_value`,
  `_press_key`, `_scroll`, `_launch`, `_focus`), so the chat's approval gate asks first;
  `desktop_list_windows`, `_observe`, `_screenshot` are not.
- `DesktopMcpTools.WINDOW` the shared `hwnd` / `window` properties; `hwnd` 0 means
  the whole desktop (taskbar, Start menu, tray) for screenshot, click, type,
  press_key and scroll.
- `DesktopMcpTools.LOOK` the `look` property (boolean, default true) of the
  `LOOKING` tools: `desktop_click`, `_type`, `_drag`, `_press_key`, `_scroll`.
- `new DesktopMcpTools(desktopService)`; `handler()` the `(name, args)` function
  for the aggregator; `handle(name, args)` the same as a method.

## Routes

`desktop_list_windows` -> `listWindows()`, `desktop_observe` -> `observe(args)`
(reply: the observation text only), `desktop_screenshot` -> `screenshot(args)`
(reply: a PNG image part plus `Screenshot of <title>: <w>x<h> px (hwnd <n>); desktop_click x/y use these pixels.`,
or `(hwnd 0); desktop_click x/y with hwnd 0 use these pixels` for a whole-desktop shot),
`desktop_click` -> `click`, `desktop_type` -> `type`, `desktop_drag` -> `drag`,
`desktop_set_value` -> `setValue`, `desktop_press_key` -> `pressKey`,
`desktop_scroll` -> `scroll`, `desktop_launch` -> `launch`, `desktop_focus` -> `focus` (awaited).

The `LOOKING` tools reply through `_acted(args, r)`: a successful reply gets
`lookAfter(args, r)`'s screenshot appended (the image plus `After the action:
screenshot of <title>: ...`), so acting and looking take one step. A failed or
thrown look never fails the action; the plain reply goes back.

## What the tool text tells the model

- `desktop_list_windows`: dialogs such as Run or Save As are listed, marked `dialog`.
- `desktop_screenshot`: click, type, press_key, scroll and drag already reply with
  a fresh screenshot, so call this only to look without acting; act on what you see; when the target is not on screen,
  scroll and look again before searching; ask the user about a personal choice
  they did not make (which profile or account).
- `desktop_click`: use `description` whenever `desktop_observe` has no ref (video
  players, canvases, games, custom-drawn apps); `ref` plus `description` tries the
  description when the ref fails; hwnd 0 clicks anywhere on the desktop.
- `desktop_type`: on a website, type into the site's own search box, since a
  made-up URL in the address bar is still a guess; navigate / click / type with a
  `tabId` act on LumaBrowser's own tabs, never on this window.
- `desktop_press_key`: when the combo brings up another window the reply's
  `nowInFront` names it, to target next.
- `desktop_scroll`: at x/y, over a `description` a vision model finds, else the
  centre; at most 10 notches per call; before scrolling a long list, look for its
  sort, season or filter controls.
- `desktop_launch` (`app` required, `args` optional): opens a program name
  (`msedge`), path, file, folder or URL as the Run dialog does and replies with the
  new windows; preferred over the Start menu or Win+R. For a website pass its home
  page and use the site's own search box and menus, never guessed deep links or
  search-URL parameters.

Success replies `McpResult.text({ success: true, data })`. A failure with a
`code` (HUMAN_NEEDED, COVERED, STOPPED) replies `{ success: false, error, code }` as an
error so the agent can branch on the code; other failures, throws and unknown
tools reply `McpResult.error`.
