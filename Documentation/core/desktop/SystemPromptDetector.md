# SystemPromptDetector

`core/desktop/SystemPromptDetector.js`

Recognises Windows prompts only the person at the keyboard may answer: UAC
consent, Windows Security credential and passkey dialogs, the sign-in screen and
the lock screen. Desktop control reports HUMAN_NEEDED instead of acting on them.

## Methods

- `SystemPromptDetector.detect({ exe?, className? })` `{ kind, label }` or null.
  `kind` is `uac`, `credential`, `logon` or `lock`; `label` is the user-facing
  name. The exe's base name is checked first (Windows or POSIX separators), then
  the window class.
- `SystemPromptDetector.BY_EXE`, `SystemPromptDetector.BY_CLASS` the patterns.

## Why

Input either cannot reach these prompts (secure desktop, elevation) or must not:
an agent approving its own elevation or typing a password is exactly what they
exist to prevent. The window class is checked too because the owning process
(consent.exe runs as SYSTEM) may not be queryable.
