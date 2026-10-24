const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class WindhawkElevation {
  static CANCELED = 1223;
  static TIMEOUT_MS = 10 * 60 * 1000;

  static SCRIPT = String.raw`param([string]$PlanPath)
$ErrorActionPreference = 'Stop'
$plan = Get-Content -LiteralPath $PlanPath -Raw -Encoding UTF8 | ConvertFrom-Json
$errors = New-Object System.Collections.ArrayList
$base = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)
function ToDWord($n) { [BitConverter]::ToInt32([BitConverter]::GetBytes([uint32][double]$n), 0) }
function Run-Op($op) {
  switch ($op.op) {
    'mkdir' { [void][IO.Directory]::CreateDirectory($op.path) }
    'copy' { Copy-Item -LiteralPath $op.from -Destination $op.to -Force }
    'regSetValues' {
      $k = $base.CreateSubKey($op.key)
      try {
        if ($op.replace) { foreach ($n in $k.GetValueNames()) { $k.DeleteValue($n) } }
        foreach ($v in $op.values) {
          if ($v.kind -eq 'dword') { $k.SetValue($v.name, (ToDWord $v.data), [Microsoft.Win32.RegistryValueKind]::DWord) }
          else { $k.SetValue($v.name, [string]$v.data, [Microsoft.Win32.RegistryValueKind]::String) }
        }
      } finally { $k.Close() }
    }
    'regDeleteKey' { $base.DeleteSubKeyTree($op.key, $false) }
    'deleteFile' { if (Test-Path -LiteralPath $op.path) { Remove-Item -LiteralPath $op.path -Force } }
    'deleteDir' { if (Test-Path -LiteralPath $op.path) { Remove-Item -LiteralPath $op.path -Recurse -Force } }
    'deleteOldDlls' {
      if (Test-Path -LiteralPath $op.dir) {
        $left = @(Get-ChildItem -LiteralPath $op.dir -Filter '*.dll' | Where-Object {
          $_.Name.StartsWith($op.prefix) -and $_.Name -ne $op.keep -and $_.BaseName.Substring($op.prefix.Length) -match '(^|_)[0-9]+$'
        } | ForEach-Object { $_.FullName })
        # A DLL still loaded somewhere cannot be deleted; retry while the engine unloads it, then leave it.
        $deadline = (Get-Date).AddMilliseconds([int]$op.retryMs)
        while ($left.Count -gt 0) {
          $left = @($left | Where-Object { try { Remove-Item -LiteralPath $_ -Force; $false } catch { $true } })
          if ($left.Count -eq 0 -or (Get-Date) -ge $deadline) { break }
          Start-Sleep -Milliseconds 250
        }
      }
    }
    'sleep' { Start-Sleep -Milliseconds ([int]$op.ms) }
    default { throw "Unknown op $($op.op)" }
  }
}
foreach ($op in $plan.ops) {
  try { Run-Op $op } catch {
    if (-not $op.optional) { [void]$errors.Add(@{ op = $op.op; error = $_.Exception.Message }); break }
  }
}
$result = @{ ok = ($errors.Count -eq 0); errors = @($errors) }
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $plan.resultPath -Encoding UTF8
if ($errors.Count -eq 0) { exit 0 } else { exit 2 }
`;

  static LAUNCHER = String.raw`try {
  $argsLine = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}" -PlanPath "{1}"' -f $env:LUMA_WH_SCRIPT, $env:LUMA_WH_PLAN
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList $argsLine -Verb RunAs -WindowStyle Hidden -Wait -PassThru
  exit $p.ExitCode
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1223 }`;

  constructor({ run = WindhawkElevation._run, tmpDir = os.tmpdir() } = {}) {
    this._run = run;
    this._tmpDir = tmpDir;
  }

  async apply(ops) {
    const dir = fs.mkdtempSync(path.join(this._tmpDir, 'luma-wh-apply-'));
    const script = path.join(dir, 'apply.ps1');
    const planPath = path.join(dir, 'plan.json');
    const resultPath = path.join(dir, 'result.json');
    try {
      fs.writeFileSync(script, '﻿' + WindhawkElevation.SCRIPT, 'utf8');
      fs.writeFileSync(planPath, JSON.stringify({ ops, resultPath }), 'utf8');
      const { code, output } = await this._run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WindhawkElevation.LAUNCHER], {
        env: { ...process.env, LUMA_WH_SCRIPT: script, LUMA_WH_PLAN: planPath },
        timeout: WindhawkElevation.TIMEOUT_MS,
      });
      if (code === WindhawkElevation.CANCELED) return { ok: false, canceled: true, errors: [{ op: 'elevate', error: 'The administrator prompt was declined' }] };
      const result = WindhawkElevation._readResult(resultPath);
      if (result) return { ok: !!result.ok && code === 0, canceled: false, errors: WindhawkElevation._errors(result.errors) };
      return { ok: false, canceled: false, errors: [{ op: 'elevate', error: output || `The elevated step exited with code ${code}` }] };
    } catch (err) {
      return { ok: false, canceled: false, errors: [{ op: 'elevate', error: (err && err.message) || String(err) }] };
    } finally {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  static _readResult(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch (_) { return null; }
  }

  static _errors(raw) {
    const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return list.map((e) => ({ op: String((e && e.op) || ''), error: String((e && e.error) || 'failed') }));
  }

  static _run(cmd, args, { env, timeout }) {
    return new Promise((resolve) => {
      let output = '';
      let settled = false;
      const child = spawn(cmd, args, { env, windowsHide: true });
      const timer = setTimeout(() => { try { child.kill(); } catch (_) {} }, timeout);
      const done = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ code, output: output.trim() });
      };
      child.stdout.on('data', (d) => { output += d; });
      child.stderr.on('data', (d) => { output += d; });
      child.on('error', (err) => { output += err.message; done(-1); });
      child.on('close', (code) => done(code));
    });
  }
}

module.exports = WindhawkElevation;
