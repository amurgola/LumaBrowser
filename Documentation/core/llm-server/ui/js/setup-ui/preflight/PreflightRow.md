# PreflightRow

`core/llm-server/ui/js/setup-ui/preflight/PreflightRow.js`

Builds one preflight banner row: the issue's title and detail plus the button its declarative fix asks for.

## Methods

- `PreflightRow.fixKey(issue)`: `'<server>:<runtimeId>'` for install fixes, else `''`.
- `PreflightRow.build(doc, issue, { onInstall, onOpen, onRecheck, onDismissVram })`: the row element with its listeners. A sysdeps fix adds the apt line with Copy (label "Copied" for 1.5 s on success; a blocked clipboard leaves the label), the packageless sonames (with their vendor hint when one is known) and one line per runtime from `fix.byRuntime`.

## Globals

Reads `navigator.clipboard` through [Clipboard](../../dom/Clipboard.md).
