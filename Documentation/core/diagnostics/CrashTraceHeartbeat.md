# CrashTraceHeartbeat

`core/diagnostics/CrashTraceHeartbeat.js`

Writes heartbeat lines to the crash-trace journal so the moment of death is
bounded even when the last real event was seconds earlier, and so event-loop
stalls appear as lag.

## Methods

- `new CrashTraceHeartbeat(write, start, proc = process)`; `write(line)` appends
  to the journal, `start` is the run start time.
- `start()` ticks every 500 ms for the first 3 minutes after `start`, then every
  30 s. Timers are unref'd.
- `stop()`.

Lines: `hb lag=<ms>ms rss=<MB>MB` when a tick is more than 400 ms late;
otherwise `hb rss=<MB>MB` on every slow tick and every tenth fast one; else `hb`.

## Why two speeds

Dense while the boot path (tab restore, deferred services) runs, where the
unexplained exits happened; sparse afterwards so a days-long session's log stays small.
