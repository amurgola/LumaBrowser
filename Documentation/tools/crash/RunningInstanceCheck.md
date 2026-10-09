# RunningInstanceCheck

`tools/crash/RunningInstanceCheck.js`

Read-only check for a running instance before crash-repro launches against the real profile: `tasklist` for
`electron.exe` and `LumaBrowser.exe` on Windows, `pgrep -fl "electron|LumaBrowser"` elsewhere (its own pgrep and
crash-repro lines filtered out). It only lists; it never stops anything.

## Methods

- `RunningInstanceCheck.list({ platform, exec })`: descriptions such as `electron.exe: 2 process(es)`, or `[]`.
- Constant: `IMAGES`.
