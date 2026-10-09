const fs = require('fs');
const path = require('path');
const PowerShellRunner = require('./PowerShellRunner');
const UserPathScripts = require('./UserPathScripts');

class UserPathEditor {
  static async addDirectory(directory) {
    const invalid = await UserPathEditor._validate(directory);
    if (invalid) return { success: false, error: invalid };
    const result = await PowerShellRunner.run(UserPathScripts.persistScript(directory));
    if (!result.ok) {
      return { success: false, error: PowerShellRunner.failureMessage(result, 'PowerShell SetEnvironmentVariable failed') };
    }
    UserPathEditor._addToLiveProcessPath(directory);
    return { success: true, status: (result.stdout || '').trim() || 'added' };
  }

  static async _validate(directory) {
    if (process.platform !== 'win32') return 'Only implemented on Windows.';
    if (!directory || typeof directory !== 'string') return 'directory is required';
    const exe = path.join(directory, 'nvidia-smi.exe');
    try {
      await fs.promises.access(exe, fs.constants.F_OK);
      return null;
    } catch (_) {
      return `nvidia-smi.exe not found at ${exe}`;
    }
  }

  static _addToLiveProcessPath(directory) {
    const entries = (process.env.PATH || '').split(';');
    if (entries.some((p) => p && p.toLowerCase() === directory.toLowerCase())) return;
    process.env.PATH = process.env.PATH ? `${process.env.PATH};${directory}` : directory;
  }
}

module.exports = UserPathEditor;
