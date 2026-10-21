# RunFault

`extensions/site-apis/runtime/RunFault.js`

An Error carrying a `spec/Faults` record, so every runtime class stops a run the same way and the runner reads
one shape at the top.

## Methods

- `new RunFault(fault)`: `fault` is `Faults.make(...)`'s record, readable as `.fault`.
- `RunFault.make(code, message, { step, detail })`, `RunFault.step(index, message, detail)` (a `step_failed`).
- `RunFault.faultOf(err, index)`: a RunFault's own fault; any other thrown value becomes `step_failed` at `index`.
