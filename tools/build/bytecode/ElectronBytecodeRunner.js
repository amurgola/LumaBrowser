const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class ElectronBytecodeRunner {
  static COMPILER_DIR = path.join(__dirname, '..', '..', '..', 'scripts', 'bytecode-compiler');

  constructor({ electronPath, spawn = spawnSync, compilerDir = ElectronBytecodeRunner.COMPILER_DIR } = {}) {
    this._electronPath = electronPath;
    this._spawn = spawn;
    this._compilerDir = compilerDir;
  }

  compile(jsFiles, workDir) {
    const job = this._writeJob(jsFiles, workDir);
    try {
      const status = this._runCompiler(job);
      return ElectronBytecodeRunner._failures(ElectronBytecodeRunner._readResults(job.resultPath, status));
    } finally {
      fs.rmSync(job.jobPath, { force: true });
      fs.rmSync(job.resultPath, { force: true });
    }
  }

  _writeJob(jsFiles, workDir) {
    const jobPath = path.join(workDir, `lumab-bytecode-job-${process.pid}.json`);
    const resultPath = path.join(workDir, `lumab-bytecode-result-${process.pid}.json`);
    const jobs = jsFiles.map((input) => ({ input, output: input.replace(/\.js$/, '.jsc') }));
    fs.writeFileSync(jobPath, JSON.stringify(jobs), 'utf8');
    return { jobPath, resultPath };
  }

  _runCompiler({ jobPath, resultPath }) {
    const env = { ...process.env, LUMA_BYTECODE_JOB: jobPath, LUMA_BYTECODE_RESULT: resultPath };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = this._spawn(this._electron(), [this._compilerDir], { stdio: 'inherit', env });
    return child && child.status;
  }

  _electron() {
    const exe = this._electronPath || require('electron');
    if (typeof exe !== 'string') {
      throw new Error('[bytenode] require("electron") did not return the binary path. This hook must run under '
        + 'plain Node (electron-builder), not ELECTRON_RUN_AS_NODE.');
    }
    return exe;
  }

  static _readResults(resultPath, status) {
    try {
      return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    } catch (_) {
      throw new Error(`[bytenode] the Electron compiler wrote no results (exit=${status}). On a headless Linux `
        + 'builder this usually means no display: run the build under xvfb-run.');
    }
  }

  static _failures(results) {
    return new Map(results.filter((r) => !r.ok).map((r) => [r.input, r.error]));
  }
}

module.exports = ElectronBytecodeRunner;
