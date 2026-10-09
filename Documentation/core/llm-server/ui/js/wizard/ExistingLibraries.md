# ExistingLibraries

`core/llm-server/ui/js/wizard/ExistingLibraries.js`

`ExistingLibraries.mount(wizard, host, recFor)`: lists chat models already on this machine (open as soon as one is found); picking one adopts it through [ImportFlow](ImportFlow.md) with the runtime and context from `recFor()`. Silent on any failure.

## Globals

None.
