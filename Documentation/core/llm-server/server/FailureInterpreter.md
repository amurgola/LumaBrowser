# FailureInterpreter

`core/llm-server/server/FailureInterpreter.js`

Turns a dead inference child's error text into an actionable diagnosis, and
names the launch flag an argparser rejected.

## Methods

- `FailureInterpreter.interpret(text)` returns `{ kind, title, advice }` for the
  first matching rule, or `null` when nothing matches (callers then show the raw
  text). Kinds: `oom`, `unknown-flag`, `openvino-device` (OpenVINO could not
  open the device `GGML_OPENVINO_DEVICE` names: `ov::Exception`, "Incompatible
  OpenCL runtime", the rusticl "Patched Mesa libclc" line; the advice names
  the Intel compute runtime and NPU driver packages and the CPU device as the
  way out), `unknown-architecture` (llama.cpp's "unknown model architecture":
  the runtime build predates the model, so the advice is to update or switch
  the runtime, not to re-download), `bad-model`, `driver` (now also "cannot
  open shared object file").
- `FailureInterpreter.extractUnknownFlag(text)` returns the flag named by an
  unknown-flag failure (`--no-mmap`, `-lm`), or `null`.
- `FailureInterpreter.RULES` is the ordered rule table.

## Why

Two consumers: the launcher's OOM rescue keys its one-shot conservative replan
off `kind === 'oom'` and its unsupported-flag memory off `extractUnknownFlag`;
the runtime server ships the interpretation to the LLM tab as `lastErrorInfo` so
the status card leads with what to do instead of a stderr dump.

Rule order matters. llama.cpp OOMs often read "error loading model: unable to
allocate CUDA0 buffer", which also matches the bad-model patterns, so memory
rules are tried first. The unknown-architecture rule sits before bad-model for
the same reason: its line also reads "error loading model". Seen 2026-11-20
when luma-b8 (upstream pin b11721) was handed Inkling 2 Mini
(`inkling2_loop`, mainline from b12600).

`extractUnknownFlag` covers the wordings seen across llama.cpp generations
(`invalid argument: --x` on current mainline, `unknown argument: --x` on older
builds and forks, `unrecognized arguments: --x` on argparse-style servers). A
bad value for a known flag (`error while handling argument "--x"`) is
deliberately not matched, because dropping that flag would hide a real mistake.
