# Crash scripts

The crash-investigation entries under `scripts/`. Only `crash-repro.js` is JavaScript (a thin entry for
[CrashRepro](CrashRepro.md)); the rest are standalone PowerShell and Python tools kept as they were.

| Script | Calls | Notes |
|---|---|---|
| `scripts/crash-repro.js` | [CrashRepro](CrashRepro.md) | `npm run crash:repro -- [--runs N] [--hold MS] [--continue] [--out DIR] [--interact] [--pause MS] [--drive] [--dry-run] [--help]`; exit 0 clean, 1 reproduced, 2 refused. Set `LUMA_DATA_DIR` (and `LUMA_CLI_HANDSHAKE`, `LUMA_API_PORT`) for an isolated run |
| `scripts/crash-repro-interact.ps1` | Win32 user32 via `Add-Type` | `-ProcId <pid> [-Seconds 12] [-StartDelayMs 2500]`; started by [InteractionDriver](InteractionDriver.md) for `--interact`. Focuses the window, sweeps the mouse, clicks the address bar, Ctrl+L / Ctrl+T / Ctrl+W / Ctrl+Tab, resizes and moves the window; idles when another window has the foreground |
| `scripts/decode-minidump.py` | `minidump` (pip) | `python scripts/decode-minidump.py <file.dmp> [--slots 60]`: exception code and address, faulting module + offset, a stack-slot walk of the crashing thread, and the Crashpad annotations CrashTracer attaches (`last_mark`, `run_log`). Without arguments prints its usage |
| `scripts/symbolize-breakpad.py` | none (stdlib) | `python scripts/symbolize-breakpad.py <file.sym> 0x<offset> ...`: maps module offsets to `function+0xN [file:line]` with Electron's breakpad `.sym` (from the `*-symbols.zip` release asset) |

Workflow: `crash:repro` reproduces and keeps `run-NN/*.dmp`; `decode-minidump.py` names the faulting module and
offset; `symbolize-breakpad.py` turns `electron.exe` offsets into functions.
