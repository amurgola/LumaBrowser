'use strict';

const { app } = require('electron');
const BytecodeJob = require('../../tools/build/bytecode/BytecodeJob');

app.disableHardwareAcceleration();

app.on('ready', async () => {
  const jobPath = process.env.LUMA_BYTECODE_JOB;
  const resultPath = process.env.LUMA_BYTECODE_RESULT;
  if (!jobPath || !resultPath) {
    console.error('[bytecode-compiler] LUMA_BYTECODE_JOB / LUMA_BYTECODE_RESULT not set');
    app.exit(1);
    return;
  }
  try {
    const ok = await new BytecodeJob({ bytenode: require('bytenode'), jobPath, resultPath }).run();
    app.exit(ok ? 0 : 1);
  } catch (err) {
    console.error(`[bytecode-compiler] ${err.message}`);
    app.exit(1);
  }
});
