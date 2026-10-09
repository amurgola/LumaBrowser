const { execFile } = require('child_process');

class WindowsUserPath {
  static COMMAND_TIMEOUT_MS = 30 * 1000;

  static PRELUDE = `$ErrorActionPreference = 'Stop'
$dir = __DIR__
$changed = $false
$k = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
$cur = [string]$k.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
$parts = @($cur -split ';')`;

  static BROADCAST = `if ($changed) {
  Add-Type -Namespace LumaShim -Name Env -MemberDefinition '[DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);'
  [UIntPtr]$r = [UIntPtr]::Zero
  [LumaShim.Env]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$r) | Out-Null
}`;

  static RESULT = "Write-Output ($(if ($changed) { 'changed' } else { 'unchanged' }))";

  static addScript(dir) {
    return WindowsUserPath._script('# luma:add', dir, `if (-not ($parts | Where-Object { $_ -ne '' -and $_.TrimEnd('\\') -ieq $dir.TrimEnd('\\') })) {
  if ($cur -eq '') { $new = $dir } elseif ($cur.EndsWith(';')) { $new = $cur + $dir + ';' } else { $new = $cur + ';' + $dir }
  $k.SetValue('Path', $new, [Microsoft.Win32.RegistryValueKind]::ExpandString); $changed = $true
}`);
  }

  static removeScript(dir) {
    return WindowsUserPath._script('# luma:remove', dir, `$next = @($parts | Where-Object { $_ -eq '' -or $_.TrimEnd('\\') -ine $dir.TrimEnd('\\') })
if ($next.Count -ne $parts.Count) { $k.SetValue('Path', ($next -join ';'), [Microsoft.Win32.RegistryValueKind]::ExpandString); $changed = $true }`);
  }

  static parseRegQuery(stdout) {
    const match = /^\s*Path\s+REG_(?:EXPAND_)?SZ\s+(.*)$/im.exec(String(stdout || ''));
    return match ? match[1].trim() : '';
  }

  static quote(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  static _script(tag, dir, body) {
    const lines = [tag, WindowsUserPath.PRELUDE, body, '$k.Close()', WindowsUserPath.BROADCAST, WindowsUserPath.RESULT];
    return lines.join('\n').replace('__DIR__', () => WindowsUserPath.quote(dir));
  }

  constructor({ exec } = {}) {
    this._exec = exec || execFile;
  }

  async read() {
    const out = await this._run('reg', ['query', 'HKCU\\Environment', '/v', 'Path']);
    return WindowsUserPath.parseRegQuery(out);
  }

  async add(dir) {
    return (await this._powershell(WindowsUserPath.addScript(dir))) === 'changed';
  }

  async remove(dir) {
    return (await this._powershell(WindowsUserPath.removeScript(dir))) === 'changed';
  }

  async _powershell(script) {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const out = await this._run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded]);
    return String(out || '').trim().split(/\r?\n/).pop().trim();
  }

  _run(file, args) {
    return new Promise((resolve, reject) => {
      this._exec(file, args, { windowsHide: true, timeout: WindowsUserPath.COMMAND_TIMEOUT_MS }, (err, stdout, stderr) => {
        if (err) return reject(new Error(String(stderr || err.message || 'command failed').trim()));
        resolve(String(stdout || ''));
      });
    });
  }
}

module.exports = WindowsUserPath;
