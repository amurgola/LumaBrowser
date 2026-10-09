const childProcess = require('child_process');

class DockerExec {
  static TIMEOUT_MS = 60 * 1000;
  static MAX_BUFFER = 64 * 1024 * 1024;

  static _spawnSync = childProcess.spawnSync;

  static dockerBin() {
    return process.env.LUMA_DOCKER_BIN || 'docker';
  }

  static setSpawnSync(fn) {
    DockerExec._spawnSync = fn || childProcess.spawnSync;
  }

  static exec(container, argv, { input, timeoutMs, workdir } = {}) {
    const args = DockerExec._execArgs(container, argv, { input, workdir });
    const result = DockerExec._spawnSync(DockerExec.dockerBin(), args, {
      input, windowsHide: true, timeout: timeoutMs || DockerExec.TIMEOUT_MS, maxBuffer: DockerExec.MAX_BUFFER,
    });
    return DockerExec._toResult(result);
  }

  static sh(container, script, params = [], options) {
    return DockerExec.exec(container, ['sh', '-c', script, 'sh', ...params], options);
  }

  static _execArgs(container, argv, { input, workdir }) {
    const args = ['exec'];
    if (input !== undefined) args.push('-i');
    if (workdir) args.push('-w', workdir);
    args.push(container, ...argv);
    return args;
  }

  static _toResult(result) {
    return {
      status: result.error ? null : result.status,
      stdout: result.stdout || Buffer.alloc(0),
      stderr: result.stderr ? result.stderr.toString('utf8') : '',
      error: result.error || null,
    };
  }
}

module.exports = DockerExec;
