const { execFile } = require('child_process');

class WindowText {
  static DEFAULT_MAX_CHARS = 20000;
  static DEFAULT_MAX_NODES = 3000;
  static TIMEOUT_MS = 12000;
  static MAX_BUFFER = 8 * 1024 * 1024;

  static SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
try {
  Add-Type -AssemblyName UIAutomationClient
  Add-Type -AssemblyName UIAutomationTypes
  $AE = [System.Windows.Automation.AutomationElement]
  $Auto = [System.Windows.Automation.Automation]
  $maxChars = __MAX_CHARS__
  $maxNodes = __MAX_NODES__
  $root = $AE::FromHandle([IntPtr]::new([long]__HWND__))
  $cr = New-Object System.Windows.Automation.CacheRequest
  foreach ($p in @($AE::NameProperty, $AE::ControlTypeProperty, $AE::IsOffscreenProperty, $AE::IsPasswordProperty, $AE::IsTextPatternAvailableProperty, $AE::IsValuePatternAvailableProperty)) { $cr.Add($p) }
  $cr.TreeFilter = $Auto::ContentViewCondition
  $scope = $cr.Activate()
  try {
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $Auto::ContentViewCondition)
  } finally { $scope.Dispose() }
  $parts = New-Object System.Collections.ArrayList
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $docText = ''
  $total = 0
  $n = 0
  $truncated = $false
  foreach ($el in $all) {
    $n++
    if ($n -gt $maxNodes) { $truncated = $true; break }
    $c = $el.Cached
    if ($c.IsOffscreen -or $c.IsPassword) { continue }
    $role = $c.ControlType.ProgrammaticName -replace '^ControlType\.', ''
    $t = $null
    $isDoc = $false
    if (($role -eq 'Document' -or $role -eq 'Edit') -and $el.GetCachedPropertyValue($AE::IsTextPatternAvailableProperty) -eq $true) {
      try { $t = $el.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern).DocumentRange.GetText([Math]::Max(1, $maxChars - $total)); $isDoc = $true } catch { }
    }
    if (-not $t -and $role -eq 'Edit' -and $el.GetCachedPropertyValue($AE::IsValuePatternAvailableProperty) -eq $true) {
      try { $t = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { }
    }
    if (-not $t) { $t = [string]$c.Name }
    $t = ([string]$t).Trim()
    if (-not $t) { continue }
    if (-not $seen.Add($t)) { continue }
    if (-not $isDoc -and $docText.Length -and $docText.Contains($t)) { continue }
    $remaining = $maxChars - $total
    if ($t.Length -gt $remaining) { $t = $t.Substring(0, [Math]::Max(0, $remaining)); $truncated = $true }
    if ($t) {
      [void]$parts.Add($t)
      $total += $t.Length + 1
      if ($isDoc) { $docText += $t }
    }
    if ($total -ge $maxChars) { $truncated = $true; break }
  }
  [Console]::Out.Write((ConvertTo-Json -Compress -InputObject ([ordered]@{ ok = $true; text = ($parts -join [string][char]10); count = $parts.Count; truncated = $truncated })))
} catch {
  [Console]::Out.Write((ConvertTo-Json -Compress -InputObject ([ordered]@{ ok = $false; error = $_.Exception.Message })))
}
`;

  constructor({ execFileImpl = execFile, timeoutMs = WindowText.TIMEOUT_MS } = {}) {
    this._execFile = execFileImpl;
    this._timeoutMs = timeoutMs;
  }

  read(hwnd, { maxChars = WindowText.DEFAULT_MAX_CHARS, maxNodes = WindowText.DEFAULT_MAX_NODES } = {}) {
    const script = WindowText.script(hwnd, { maxChars, maxNodes });
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const args = ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded];
    return new Promise((resolve, reject) => {
      this._execFile('powershell.exe', args, { windowsHide: true, timeout: this._timeoutMs, maxBuffer: WindowText.MAX_BUFFER, encoding: 'utf8' }, (err, stdout) => {
        const reply = WindowText.parse(stdout);
        if (reply && reply.ok) {
          resolve({ text: typeof reply.text === 'string' ? reply.text : '', count: Number(reply.count) || 0, truncated: !!reply.truncated });
          return;
        }
        if (reply && reply.error) reject(new Error(String(reply.error)));
        else if (err && err.killed) reject(new Error(`UI Automation took longer than ${this._timeoutMs} ms`));
        else reject(new Error((err && err.message) || 'UI Automation gave no answer'));
      });
    });
  }

  static script(hwnd, { maxChars = WindowText.DEFAULT_MAX_CHARS, maxNodes = WindowText.DEFAULT_MAX_NODES } = {}) {
    const int = (v, name) => {
      const n = Math.trunc(Number(v));
      if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a non-negative integer`);
      return String(n);
    };
    return WindowText.SCRIPT
      .replace('__HWND__', int(hwnd, 'hwnd'))
      .replace('__MAX_CHARS__', int(Math.max(1, maxChars), 'maxChars'))
      .replace('__MAX_NODES__', int(Math.max(1, maxNodes), 'maxNodes'));
  }

  static parse(stdout) {
    const text = String(stdout || '').trim();
    const start = text.indexOf('{');
    if (start < 0) return null;
    try {
      return JSON.parse(text.slice(start));
    } catch (_) {
      return null;
    }
  }
}

module.exports = WindowText;
