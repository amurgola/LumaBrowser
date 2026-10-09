# BytecodeJob

`tools/build/bytecode/BytecodeJob.js`

The compile loop inside `scripts/bytecode-compiler/main.js`: reads the job file
(`[{ input, output }]`), calls
`bytenode.compileFile({ filename, compileAsModule: true, output })` for each
(never `electron: true`; this already is the Electron main process) and writes
`[{ input, ok, error }]`.

## Methods

- `new BytecodeJob({ bytenode, jobPath, resultPath })`; `run()` resolves to true
  when every file compiled.
