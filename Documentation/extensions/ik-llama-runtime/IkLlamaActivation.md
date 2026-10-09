# IkLlamaActivation

`extensions/ik-llama-runtime/IkLlamaActivation.js`

Registers the ik_llama.cpp runtime rows with `context.llmCatalog`.

## Methods

- `IkLlamaActivation.activate(context)` resolves `{}`. Without
  `context.llmCatalog.registerRuntime` it logs `UNAVAILABLE_WARNING` through
  `context.logger.warn` (when there is a logger) and registers nothing.
  Otherwise it detects the host ISA ([HostIsa](HostIsa.md)), builds the rows
  ([IkLlamaCatalog](IkLlamaCatalog.md)), registers each with `hooks = null`, and
  logs `registered <n> ik_llama runtime rows (<ids>); CPU build variant <isa> via <source>`.
- `IkLlamaActivation.UNAVAILABLE_WARNING`.
