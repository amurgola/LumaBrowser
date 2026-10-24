# WindowText

`extensions/desktop-integration/features/ask/WindowText.js`

Reads the readable text of a window through UI Automation, read only, in one
short-lived hidden `powershell.exe` per read (about 300 ms on a warm machine).

Why not the desktop control sidecar ([UiaHost](../../../../core/desktop/uia/UiaHost.md)):
its script is passed as `-EncodedCommand` and is already 32060 of the 32767
characters Windows allows on a command line, so it cannot take a new command.
Its `tree` returns interactive elements only (no document text). The sidecar is
still used for the Chromium accessibility `wake` ([WindowCapture](WindowCapture.md)).

## What it reads

The content-view descendants of the window, in document order:

- documents and edit boxes: their full text (TextPattern `DocumentRange`, else
  ValuePattern for edits);
- every other element: its name;
- skipped: offscreen elements, password fields, empty names, exact repeats, and
  names already contained in a document's text taken earlier.

It stops at `maxChars` characters (default 20000) or `maxNodes` elements
(default 3000) and says `truncated`. Parts are joined with newlines.

## API

- `new WindowText({ execFileImpl, timeoutMs = 12000 })`.
- `read(hwnd, { maxChars, maxNodes }) -> Promise<{ text, count, truncated }>`;
  rejects with the UI Automation error, a timeout, or "gave no answer".
- `static script(hwnd, opts)`: the script with its three integers filled in;
  throws for anything that is not a non-negative number, so no caller text ever
  reaches PowerShell.
- `static parse(stdout)`: the JSON object on stdout, or null.
