const PowerShellRunner = require('./PowerShellRunner');

class UserPathScripts {
  static displayCommand(directory) {
    return [
      '# Adds the directory containing nvidia-smi.exe to your User PATH so',
      '# other tools and shells can find it without needing the full path.',
      '# Safe to re-run: does nothing when the directory is already on PATH.',
      `$nvidiaSmiDir = '${PowerShellRunner.quote(directory)}'`,
      '$nvidiaSmiExe = Join-Path $nvidiaSmiDir \'nvidia-smi.exe\'',
      '',
      'if (-not (Test-Path $nvidiaSmiExe)) {',
      '  Write-Error "nvidia-smi.exe not found at $nvidiaSmiExe"; return',
      '}',
      '',
      '$userPath = [Environment]::GetEnvironmentVariable(\'Path\',\'User\')',
      '$entries  = @()',
      'if ($userPath) { $entries = $userPath -split \';\' | Where-Object { $_ } }',
      '',
      'if ($entries -inotcontains $nvidiaSmiDir) {',
      '  if ($userPath) { $newUserPath = "$userPath;$nvidiaSmiDir" } else { $newUserPath = $nvidiaSmiDir }',
      '  [Environment]::SetEnvironmentVariable(\'Path\', $newUserPath, \'User\')',
      '  Write-Output "Added $nvidiaSmiDir (contains nvidia-smi.exe) to User PATH"',
      '} else {',
      '  Write-Output "$nvidiaSmiDir is already in User PATH; nvidia-smi.exe should be reachable from new shells"',
      '}',
    ].join('\n');
  }

  static persistScript(directory) {
    return `
    $ErrorActionPreference = 'Stop'
    try {
      $dir = '${PowerShellRunner.quote(directory)}'
      $cur = [Environment]::GetEnvironmentVariable('Path','User')
      $parts = @()
      if ($cur) { $parts = $cur -split ';' | Where-Object { $_ } }
      $exists = $false
      foreach ($p in $parts) { if ($p -ieq $dir) { $exists = $true } }
      if ($exists) {
        Write-Output 'already-present'
      } else {
        if ($cur) { $new = "$cur;$dir" } else { $new = $dir }
        [Environment]::SetEnvironmentVariable('Path', $new, 'User')
        Start-Sleep -Milliseconds 100
        $check = [Environment]::GetEnvironmentVariable('Path','User')
        $checkParts = @()
        if ($check) { $checkParts = $check -split ';' | Where-Object { $_ } }
        $present = $false
        foreach ($p in $checkParts) { if ($p -ieq $dir) { $present = $true } }
        if (-not $present) {
          throw "SetEnvironmentVariable returned, but the user-scope PATH did not include the new directory after readback. This usually means a group policy or ACL is overriding the write."
        }
        Write-Output 'added'
      }
    } catch {
      [Console]::Error.WriteLine($_.Exception.Message)
      exit 1
    }
  `;
  }
}

module.exports = UserPathScripts;
