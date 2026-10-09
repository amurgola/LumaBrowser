# WriteTargets

`core/shell/shellClassifier/WriteTargets.js`

Lists the arguments a known file-writing command writes to, for the writes-stay-within-the-project check.

## Methods

- `WriteTargets.of(name, args, dialect)` returns an array of target words, or `null` when the command is not a
  recognised writer (the caller decides whether that means "unverifiable").

## Coverage

- PowerShell writers (`Remove-Item`, `New-Item`, `Set-Content`, `Out-File`, `Copy-Item`, `Move-Item`,
  `Rename-Item`, `Invoke-WebRequest -OutFile`, ... and aliases): named `-Path/-LiteralPath/-Destination/-FilePath/
  -DestinationPath/-OutFile/-NewName` values plus positionals. Copy writes the destination; move and rename also
  write (delete) the source. Downloads write only their named output. `New-Item` item types are not paths. `$null`
  and `$_` are dropped.
- cmd writers (`del`, `rd`, `md`, `copy`, `move`, `ren`, `xcopy`, `robocopy`, `attrib`, `icacls`, `takeown`).
  `robocopy` writes its second positional.
- POSIX: `curl -o/--output/-O`, `wget -O/-P` (cwd by default), file-argument writers (`rm`, `mkdir`, `touch`,
  `mv`, `tee`, `chmod`, ...), `tar` only when extracting (into `-C` or cwd), `unzip` (into `-d` or cwd), `patch`
  (cwd), last-argument writers (`cp`, `scp`), `dd of=`, and `sed -i`'s file.
