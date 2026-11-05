const fs = require('fs');
const path = require('path');

class AcpAgentEntry {
  static ARGS = ['acp'];
  static NODE_MODE_ENV = { ELECTRON_RUN_AS_NODE: '1' };

  static build({ cliShim, exists = fs.existsSync } = {}) {
    if (!cliShim || !cliShim.exePath || !cliShim.cliSource) return null;
    const copied = typeof cliShim.cliScript === 'function' ? cliShim.cliScript() : null;
    const script = copied && exists(copied) ? copied : path.join(cliShim.cliSource, 'bin', 'luma.js');
    return { command: cliShim.exePath, args: [script, ...AcpAgentEntry.ARGS], env: { ...AcpAgentEntry.NODE_MODE_ENV } };
  }
}

module.exports = AcpAgentEntry;
