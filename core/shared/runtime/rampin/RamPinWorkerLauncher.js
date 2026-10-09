const path = require('path');

class RamPinWorkerLauncher {
  static WORKER_PATH = path.join(__dirname, 'RamPinWorker.js');

  static fork(workerPath, serviceName) {
    const utilityProcess = RamPinWorkerLauncher._utilityProcess();
    if (utilityProcess) {
      return utilityProcess.fork(workerPath, [], { serviceName, stdio: 'pipe', env: { ...process.env } });
    }
    return RamPinWorkerLauncher._forkChild(workerPath);
  }

  static _utilityProcess() {
    try {
      const electron = require('electron');
      const utilityProcess = electron && electron.utilityProcess;
      return utilityProcess && typeof utilityProcess.fork === 'function' ? utilityProcess : null;
    } catch (_) {
      return null;
    }
  }

  static _forkChild(workerPath) {
    const { fork } = require('child_process');
    const child = fork(workerPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.postMessage = (message) => { try { child.send(message); } catch (_) {} };
    return child;
  }
}

module.exports = RamPinWorkerLauncher;
