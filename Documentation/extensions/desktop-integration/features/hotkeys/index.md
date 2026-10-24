# hotkeys feature

`extensions/desktop-integration/features/hotkeys/index.js`

System-wide Luma actions. Luma registers global shortcuts itself (Electron
`globalShortcut`), so no Windhawk mod or other helper is needed; every action is
also triggerable over REST, so AutoHotkey, Stream Deck, PowerToys or a Windhawk
mod can fire them with their own keys. On by default. Wiring lives in
[HotkeysFeature](HotkeysFeature.md).

## Actions

| id | Default shortcut | What |
| --- | --- | --- |
| `read-selection` | `Ctrl+Alt+Shift+R` | Copies the text selected in the app in front and speaks it with `deps.speech`. Pressed again while it is still talking, it stops. With nothing selected and a chat model that can see images, the user drags over text on screen (or the window picked on the shortcut hint is used whole) and the model's transcript is spoken ([ScreenTextReader](ScreenTextReader.md)). |
| `rewrite-selection` | `Ctrl+Alt+Shift+E` | Copies the selection, rewrites it with the chat's model (configurable instruction) and pastes the answer over the selection. If the source window cannot be brought back, the answer is left on the clipboard. |
| `clipboard-to-chat` | `Ctrl+Alt+Shift+V` | Opens a new chat (`deps.handoff.open`) with the clipboard: text up to 4000 characters in the composer, longer text as `clipboard.txt`, an image as `clipboard.png`. |
| `screenshot-to-chat` | `Ctrl+Alt+Shift+S` | Freezes the screen, shows a dimmed overlay on every display, the user drags a rectangle (Esc or right click cancels), and the region opens in a new chat as `screenshot.png`. With a window picked on the shortcut hint, that window is captured whole (`window.png`), no drag. |

The two selection actions send Ctrl+C / Ctrl+V to the app in front, through a
per-platform backend ([SelectionKeys](SelectionKeys.md)):

| Platform | Copy | Paste | Notes |
| --- | --- | --- | --- |
| Windows | Ctrl+C with SendInput ([NativeKeys](NativeKeys.md)) | Ctrl+V | |
| macOS | Cmd+C posted with CoreGraphics ([MacKeys](MacKeys.md)) | Cmd+V | Needs Accessibility permission (System Settings > Privacy & Security > Accessibility); the first failed try asks macOS to show its prompt, and the action answers `NO_PERMISSION` (403) until it is granted. |
| Linux X11 | Ctrl+C with XTEST ([LinuxKeys](LinuxKeys.md)) | Ctrl+V | Needs libX11 and libXtst (on every X desktop). An unchanged clipboard falls back to the primary selection. |
| Linux Wayland | The primary selection (the highlighted text), no keystroke | `wtype` (wlroots desktops: Sway, Hyprland) or `ydotool` (needs its daemon) if installed | Without either, Rewrite leaves its answer on the clipboard for a manual paste. Global shortcuts themselves are limited on Wayland. |

Elsewhere they report `UNSUPPORTED`. The clipboard and screenshot actions work
on every platform (the screenshot uses `desktopCapturer` off Windows). The
shortcut hint, the window pick and the screen-text fallback's window capture
are still Windows-only.

Selection grabbing ([SelectionClipboard](SelectionClipboard.md)): Luma does not
take focus. It waits up to 1.5 s for the hotkey's Ctrl/Alt/Shift/Win to be
released (then sends their key-ups), saves the clipboard (text, HTML, RTF,
image), sends Ctrl+C, waits up to 800 ms for the clipboard sequence number to
change, reads the text and restores the clipboard. No change means nothing was
selected (`NO_SELECTION`).

## Routes

- `GET /api/desktop/hotkeys/` -> `{ success, platform, actions: [{ id, label, description, supported, binding, registered, conflict }], busy: [ids], speaking }`.
  `binding` is the normalized accelerator (`''` when unbound); `conflict` says
  why a binding is not registered (taken by another program, bound to two
  actions, invalid).
- `POST /api/desktop/hotkeys/run { action }` runs one action and answers its
  result: `{ success: true, action, ... }` (read-selection: `speaking, chars` or
  `stopped`; rewrite-selection: `chars, restored`; the chat actions: the
  handoff's `conversationId, autoSent, attached, rejected`, the screenshot also
  `width, height`). Failures are `{ success: false, error, code }` with status
  400 `UNKNOWN_ACTION` (or a missing action), 409 `BUSY` / `CANCELED` /
  `FOCUS_LOST`, 422 `NO_SELECTION` / `EMPTY_CLIPBOARD` / `EMPTY` / `TOO_LONG`,
  501 `UNSUPPORTED`, 503 `NO_TTS` / `NO_MODEL`, 504 `TIMEOUT`, 500 otherwise.
  The request waits for the action (a screenshot waits for the drag, a rewrite
  for the model), so give the client a longer timeout for those two.

A client firing the selection actions from its own hotkey should let Luma do
the copying: the modifier wait covers the client's keys too.

## Settings (`settingsSchema`)

| key | type | default |
| --- | --- | --- |
| `binding.read-selection`, `binding.rewrite-selection`, `binding.clipboard-to-chat`, `binding.screenshot-to-chat` | hotkey | the shortcuts above; empty = no shortcut |
| `rewriteInstruction` | textarea | `Rewrite this to be clearer and more concise. Reply with only the rewritten text.` |
| `rewriteModel` | text | `''` (the chat's current model) |
| `rewriteTimeoutSec` | number (5 to 600) | 60 |
| `readScreen` | bool | true (Read aloud with nothing selected reads text off the screen; needs a model that can see images) |
| `screenTextModel` | text | `''` (the chat's current model) |
| `autoSend` | bool | false (clipboard and screenshot handoffs only fill the composer) |
| `overlayIsland` | bool | true (the activity island: Reading aloud with Pause, Stop, Continue in LumaBrowser; rewrite progress; failures) |
| `shortcutHints` | bool | true (hold the shortcuts' modifiers for a moment: the ring sweeps on and the island lists the next keys; click a window meanwhile to aim the actions at it) |
| `overlayRing` | bool | true (a soft light around the active monitor while reading or rewriting) |
| `notifyFailures` | bool | true (a native notification when an action fails and the island is off; cancels and busy are silent) |

Changing a `binding.*` key re-registers every shortcut (`onSettingsChanged`).
Bindings accept Electron accelerator text in any case (`ctrl+alt+shift+r`).

## Files

- [HotkeysFeature](HotkeysFeature.md): wiring, routes, settings, notifications.
- [HotkeyActions](HotkeyActions.md): the four actions.
- [HotkeyBindings](HotkeyBindings.md): globalShortcut registration and status.
- [SelectionClipboard](SelectionClipboard.md): copy and paste the selection.
- [SelectionKeys](SelectionKeys.md): picks [NativeKeys](NativeKeys.md) (Windows), [MacKeys](MacKeys.md) + [MacApi](MacApi.md) (macOS) or [LinuxKeys](LinuxKeys.md) + [X11Api](X11Api.md) (Linux).
- [SelectionRewriter](SelectionRewriter.md): the model call.
- [RegionCapture](RegionCapture.md), [RegionOverlay](RegionOverlay.md): the screen region.
- [ScreenTextReader](ScreenTextReader.md): reads a capture's text with a vision model.
- [ChordHint](ChordHint.md), [HintTarget](HintTarget.md): the shortcut hint and its window pick.
