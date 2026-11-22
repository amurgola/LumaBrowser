const path = require('path');

class BasaltLayout {
  constructor(binaryPath, platform = process.platform) {
    this.binaryPath = binaryPath;
    this.binDir = path.dirname(binaryPath);
    this.archiveDir = path.dirname(this.binDir);
    this.venvDir = path.join(this.archiveDir, '.venv');
    this.requirementsPath = path.join(this.archiveDir, 'requirements.txt');
    this.venvPython = platform === 'win32'
      ? path.join(this.venvDir, 'Scripts', 'python.exe')
      : path.join(this.venvDir, 'bin', 'python');
  }
}

module.exports = BasaltLayout;
