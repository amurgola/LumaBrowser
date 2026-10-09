# HostGlobals

`extensions/roleplay-mode/HostGlobals.js`

Lazy readers for the singletons the app parks on `global`, which a
distributable add-on reads instead of requiring core.

## Methods

- `HostGlobals.imageServerService()` `global.__lumaImageServerService` or null.
- `HostGlobals.chatRouter()` `global.__lumaChatRouter` or null.
- `HostGlobals.imageAbortSeq()` `Number(global.__lumaImageAbortSeq) || 0`.
- `HostGlobals.lab()` `global.__rpLab` (the installed LabHarness) or null.
