# RuntimeCatalogRegistry

`core/llm-server/runtimes/RuntimeCatalogRegistry.js`

Inference runtimes that extensions contribute to the LLM runtime catalog, plus
the optional hooks the core seams call instead of their built-in logic.

## Methods

Extends [ContributionRegistry](../../shared/registry/ContributionRegistry.md)
(`unregister`, `unregisterByExtension`, `list`, `getById`, `extensions`).

- `RuntimeCatalogRegistry.shared` is the process-wide instance.
- `register(entry, hooks = null, extensionId = null)` stores the entry with
  defaults `kind: 'inference'`, `acquisition: 'extension'` (the entry may
  override them) and stringified, non-empty `modelKinds`. `id` and `name` are
  required; `hooks` must be an object when given. `register(entry, extensionId)`
  (a string second argument) is also accepted so the shared contract holds.
  Errors are prefixed `llmCatalog.registerRuntime:`.
- `hooksFor(id)` returns the hook object or `null`.
- `claimedModelKinds()` lists every scanner model kind some runtime claims.
- `runtimesForModelKind(kind)` lists runtime ids whose `modelKinds` include it.
- `runtimesPreferringQuant(haystack)` lists runtime ids, in registration order,
  whose `nativeQuantPattern` (case-insensitive regex source) matches the
  scanner's filename text. A malformed pattern is skipped, never thrown.
- `onChange(listener)` subscribes to changes and returns an unsubscribe
  function; listeners receive the new `version`.
- `version` increments on every register and unregister.

## Why hooks live apart from the entry

The entry crosses IPC and is folded into the runtime catalog fingerprint, so it
must stay serializable. Hooks (`detect`, `install`, `uninstall`, `planLaunch`)
are functions and are handed to the seams through `hooksFor(id)`. All hooks are
optional: a llama.cpp fork such as ik_llama keeps `acquisition:
'github-release'` with its own repo and asset patterns, registers no hooks, and
is handled by the core paths. `planLaunch` must be synchronous because the
context estimator calls the planner once per context rung.

The catalog folds `version` into its fingerprint so the persisted runtimes view
rebuilds when an extension comes or goes; `onChange` lets the live cache drop
immediately. Hooks are already readable by the time listeners run. A throwing
listener never breaks registration.

`nativeQuantPattern` lets a contributed fork claim quantizations only it can
load (ik_llama's `IQ*_K` / `*_R4`) as a model's preferred runtimes without the
scanner naming any runtime id.
