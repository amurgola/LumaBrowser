# window-tab (page)

`extensions/desktop-integration/features/window-tabs/ui/window-tab.html`,
`window-tab.css`, `window-tab.js`

A window tab's page: the live view of one desktop window, its title and
program in a slim header (island identity: navy surfaces, ember accent, Luma's
tokens linked from `core/llm-server/ui/css/tokens.css`), a text panel, the
Control switch and a picker. The window handle and its program come in the URL
(`?hwnd=<handle>&app=<exe>`); everything goes through the preload's
`windowTab.call(name, data)` ([preload](preload.md)).

## What it does

- Capture: `navigator.mediaDevices.getDisplayMedia({ video: { frameRate } })`;
  the feature's handler grants this page its own window. The video fills the
  stage (`object-fit: contain`). A track that ends offers Try again.
- State: `state` every second while the tab is visible (5 s hidden): the
  header's title and meta line (`Live view of <app>'s window in LumaBrowser.`),
  `document.title`, the status chip (Starting, Live, Minimized, Closed, No
  picture), the Restore button while minimized, the Control switch enabled only
  while input may go through (its tooltip says why not). The app icon comes
  once from `icon` (also the favicon).
- Text: `text` on the feature's cadence (`textRefreshSec` visible, 45 s hidden)
  into `<pre id="text">` inside `<section id="text-panel">`, kept in the page
  whether the panel shows or not, so reading the tab (the chat's "ask about a
  tab", `getTabSource`) reads the window's title and accessible text. The Text
  button shows the panel beside the view.
- Control (off by default; the stage is focusable and the cursor a crosshair
  while on): a mouse-up on the picture sends `click` with the point as fractions
  of the video's picture and the button; wheel sends `wheel` (batched 90 ms,
  notches per 100 px); typed characters are buffered 160 ms and sent as `text`;
  other keys and modifier combos go as `keys` (`ctrl+shift+s`, `enter`,
  `left`, `f5`; the Meta key is `win`). A refusal shows as a toast.
- Gone: when the window closes the capture stops and the overlay offers the
  picker; "Another window" (header) lists titled app windows from `windows`,
  a click asks `open { hwnd }` and the feature navigates the page to that
  window's URL.
