# DesktopTyping

`core/desktop/service/DesktopTyping.js`

`desktop_type` after the window is resolved.

## Methods

- `new DesktopTyping(parts)`.
- `type(w, { text, mode = 'auto', ref, submit })` never throws:
  1. an invalid mode is refused (`mode must be one of auto, keys, paste.`), then
     `guards.targetRefusal(w)`;
  2. `auto` on an observed ref without `submit`: UIA ValuePattern in the
     background, even for long text (`{ method: 'uia:setValue' }`);
  3. otherwise paste (mode `paste`, or `auto` with a clipboard and
     [TypingMode](TypingMode.md).shouldPaste) or keystrokes. Paste without a
     clipboard is refused. Then the human check, bring to front (`Could not bring
     ... to the front to type.`), focus the ref through UIA if given, and type via
     [DesktopKeyboard](DesktopKeyboard.md); `submit` presses Enter after.
     `{ method: 'paste'|'keyboard', chars, clipboardRestored? }`.
