# BackgroundStarts

`app/ready/BackgroundStarts.js`

Starts the work that must not compete with the first window paint.

## Methods

- `new BackgroundStarts({ updateCheck, llmServerService, imageServerService, env, setTimeoutFn? })`.
- `schedule()`: the automatic update check at 3 s (never in Docker), the LLM
  RAM pin at 3 s, the image RAM pin at 6 s, the tool-group router at 9 s. Each
  `apply()` is a no-op when its setting is off; the unpins happen in the
  services' shutdown.

## Why

The pins stream whole models off disk. The image pin follows the LLM pin so the
two do not fight over disk bandwidth and so the LLM pin's RAM claim is in place
before the image pin's fit gate reads free memory.
