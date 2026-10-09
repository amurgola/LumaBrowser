# DiskSync

`core/llm-server/ui/js/code/DiskSync.js`

Pulls the tree and every unedited open file back off disk; a file with
unsaved edits is left alone and flagged ("Changed on disk while you were
editing: ...").

## Methods

- `refresh(explicit)`; the Refresh button passes `true` ("Up to date.").
