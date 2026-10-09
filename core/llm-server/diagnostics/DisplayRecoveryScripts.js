const PowerShellRunner = require('./PowerShellRunner');

class DisplayRecoveryScripts {
  static elevated(instanceId, resultPath) {
    return [
      "$ErrorActionPreference = 'Continue'",
      `$InstanceId = '${PowerShellRunner.quote(instanceId)}'`,
      `$ResultPath = '${PowerShellRunner.quote(resultPath)}'`,
      "$pnputil = Join-Path $env:SystemRoot 'System32\\pnputil.exe'",
      '$hasPnputil = Test-Path $pnputil',
      '$steps = New-Object System.Collections.ArrayList',
      'function Add-Step($n,$ok,$d){ [void]$steps.Add([ordered]@{ step=$n; ok=[bool]$ok; detail=("$d").Trim() }) }',
      'function Get-Dev(){ Get-PnpDevice -InstanceId $InstanceId -ErrorAction SilentlyContinue | Select-Object -First 1 }',
      "function Is-Healthy(){ $d=Get-Dev; return ($d -and $d.Status -eq 'OK' -and $d.Present) }",
      'function Try-Restart($id){ if($hasPnputil){ $o=& $pnputil /restart-device "$id" 2>&1; Add-Step "restart-device($id)" ($LASTEXITCODE -eq 0) ($o|Out-String); return ($LASTEXITCODE -eq 0) } return $false }',
      'function Try-Scan($id){ if($hasPnputil){ $o=& $pnputil /scan-devices /instanceid "$id" 2>&1; Add-Step "scan($id)" ($LASTEXITCODE -eq 0) ($o|Out-String); return ($LASTEXITCODE -eq 0) } return $false }',
      "function Try-DisableEnable($id){ try { Disable-PnpDevice -InstanceId $id -Confirm:$false -ErrorAction Stop; Start-Sleep -Seconds 4; Enable-PnpDevice -InstanceId $id -Confirm:$false -ErrorAction Stop; Add-Step \"disable-enable($id)\" $true 'ok'; return $true } catch { Add-Step \"disable-enable($id)\" $false $_.Exception.Message; return $false } }",
      '$dev = Get-Dev',
      'if ($dev -and $dev.Present) {',
      '  Try-Restart $InstanceId | Out-Null',
      '  if (-not (Is-Healthy)) { Try-DisableEnable $InstanceId | Out-Null; Start-Sleep -Seconds 2 }',
      '}',
      'if (-not (Is-Healthy)) {',
      '  $parent = $null',
      "  try { $parent = (Get-PnpDeviceProperty -InstanceId $InstanceId -KeyName 'DEVPKEY_Device_Parent' -ErrorAction Stop).Data } catch {}",
      '  if ($parent) {',
      "    Add-Step 'parent' $true $parent",
      '    Try-Scan $parent | Out-Null; Start-Sleep -Seconds 2',
      '    if (-not (Is-Healthy)) { Try-Restart $parent | Out-Null; Start-Sleep -Seconds 3 }',
      '    if (-not (Is-Healthy)) { Try-DisableEnable $parent | Out-Null; Start-Sleep -Seconds 3 }',
      '  } elseif ($hasPnputil) {',
      "    $o=& $pnputil /scan-devices 2>&1; Add-Step 'scan-all' ($LASTEXITCODE -eq 0) ($o|Out-String); Start-Sleep -Seconds 3",
      '  }',
      '}',
      'if (-not (Is-Healthy) -and $hasPnputil) {',
      '  for ($i = 0; $i -lt 7 -and -not (Is-Healthy); $i++) {',
      '    & $pnputil /scan-devices 2>&1 | Out-Null',
      '    Start-Sleep -Seconds 3',
      '  }',
      "  Add-Step 'scan-poll' (Is-Healthy) 'global rescan + poll up to 21s'",
      '}',
      '$final = Get-Dev',
      "if ($final) { $finalStatus = [string]$final.Status } else { $finalStatus = 'absent' }",
      "$ok = [bool]($final -and $final.Status -eq 'OK' -and $final.Present)",
      "$succ = $steps | Where-Object { $_.ok -and $_.step -ne 'parent' } | Select-Object -Last 1",
      "if ($succ) { $method = [string]$succ.step } else { $method = 'recovery sequence' }",
      "$tried = ($steps | Where-Object { $_.step -ne 'parent' } | ForEach-Object { $_.step }) -join ', '",
      'if ($ok) {',
      "  $message = 'Adapter is present and OK again.'",
      '} elseif (-not $final -or -not $final.Present) {',
      '  $message = "The PCIe link to this card has fully dropped (still absent after: $tried). Software cannot retrain a physically dropped link - a reboot or reseating the M.2 riser is required to get it back. To stop it dropping: in BIOS disable PCIe ASPM / set the slot to a fixed Gen (3 or 4) / disable that slot\'s power management; in Windows set Power Plan > PCI Express > Link State Power Management to Off."',
      '} else {',
      '  $message = "Adapter still \'$finalStatus\' after: $tried. A reboot - or reseating the M.2 riser - may be required."',
      '}',
      '$result = [ordered]@{ ok = $ok; method = $method; message = $message; finalStatus = $finalStatus; steps = $steps }',
      '($result | ConvertTo-Json -Compress -Depth 5) | Out-File -FilePath $ResultPath -Encoding UTF8',
      'if ($ok) { exit 0 } else { exit 1 }',
    ].join('\n');
  }

  static launcher(elevatedScript) {
    const encoded = Buffer.from(elevatedScript, 'utf16le').toString('base64');
    return [
      "$ErrorActionPreference = 'Stop'",
      'try {',
      "  $p = Start-Process -FilePath 'powershell.exe' -Verb RunAs -WindowStyle Hidden -PassThru -Wait "
        + `-ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand','${encoded}')`,
      "  Write-Output ('EXITCODE=' + [int]$p.ExitCode)",
      '} catch {',
      '  [Console]::Error.WriteLine($_.Exception.Message)',
      '  exit 1',
      '}',
    ].join('\n');
  }
}

module.exports = DisplayRecoveryScripts;
