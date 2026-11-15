
if ($Global:__LumaIntegration) { return }
$Global:__LumaIntegration = @{ LastHistoryId = -1; NativeCode = $global:LASTEXITCODE; Prompt = $function:prompt; ReadLine = $null }

function Global:__LumaEscape([string]$Text) {
  if (-not $Text) { return '' }
  [regex]::Replace($Text, '[\\;\x00-\x1f]', {
    param($match)
    if ($match.Value -eq '\') { '\\' } else { '\x{0:x2}' -f [int][char]$match.Value }
  })
}

function Global:prompt {
  $succeeded = $?
  $nativeCode = $global:LASTEXITCODE
  $esc = [char]27
  $bel = [char]7
  $marks = ''

  $last = Get-History -Count 1
  $lastId = if ($last) { $last.Id } else { -1 }
  if ($Global:__LumaIntegration.LastHistoryId -ne -1 -or $lastId -ne -1) {
    if ($lastId -ne $Global:__LumaIntegration.LastHistoryId) {
      $changed = $nativeCode -ne $Global:__LumaIntegration.NativeCode
      $code = if ($succeeded) { 0 } elseif ($changed -and $nativeCode -is [int] -and $nativeCode -ne 0) { $nativeCode } else { 1 }
      $marks += "$esc]633;D;$code$bel"
    } else {
      $marks += "$esc]633;D$bel"
    }
  }
  $Global:__LumaIntegration.LastHistoryId = $lastId
  $Global:__LumaIntegration.NativeCode = $nativeCode

  if ($pwd.Provider.Name -eq 'FileSystem') { $marks += "$esc]633;P;Cwd=$(__LumaEscape $pwd.ProviderPath)$bel" }
  $marks += "$esc]633;A$bel"

  $global:LASTEXITCODE = $nativeCode
  $text = & $Global:__LumaIntegration.Prompt
  $global:LASTEXITCODE = $nativeCode
  "$marks$text$esc]633;B$bel"
}

if (Get-Module -Name PSReadLine) {
  $Global:__LumaIntegration.ReadLine = $function:PSConsoleHostReadLine
  function Global:PSConsoleHostReadLine {
    $line = & $Global:__LumaIntegration.ReadLine
    $esc = [char]27
    $bel = [char]7
    [Console]::Write("$esc]633;E;$(__LumaEscape $line)$bel$esc]633;C$bel")
    $line
  }
}
