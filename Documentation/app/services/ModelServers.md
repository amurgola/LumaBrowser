# ModelServers

`app/services/ModelServers.js`

Builds the local model supervisors and ties them into LLM slot routing. Nothing
spawns here.

## Methods

- `new ModelServers(ctx)`; `build()` adds to `ctx.services`:
  - `llmServerService` (`rootDir` `<root>/core/llm-server`, `apiSecurity`), set
    as the LLM service's managed local provider, with the shared queue manager
    (its `--parallel` count drives the queue's per-model gate);
  - `imageServerService` and `musicServerService`, both using the LLM side's
    cached `ensureDiagnostics()` (bug H7: no second nvidia-smi probe);
  - `whisperServerService`, `ttsServerService`;
  - `groundingServerService`, set as the LLM service's grounding provider.
- A configured grounding model claims the `visual-grounding` slot
  (`GroundingServerService.PROVIDER_ID` plus its selected model) unless the
  setting `core.llm.slots.visual-grounding.provider` already names a provider.
- Publishes `__lumaLlmServerService`, `__lumaImageServerService` and
  `__lumaGroundingServer`.
