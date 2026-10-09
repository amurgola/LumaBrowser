# AntiCheatDetector

`core/desktop/AntiCheatDetector.js`

Recognises games protected by kernel anti-cheat. Desktop control and game mode
refuse to send input to them.

## Methods

- `AntiCheatDetector.detect(exePath, io = {})` the anti-cheat system's name, or
  null. Checks the exe's file name against `PROTECTED_EXES`, then the entries of
  the exe's folder and the two folders above it against `MARKERS`.
  `io.readdir(dir)` is injectable for tests; an unreadable folder counts as empty.
- `AntiCheatDetector.MARKERS` file and folder patterns anti-cheat installs next
  to a game (Easy Anti-Cheat, BattlEye, PunkBuster, GameGuard, XIGNCODE3,
  miHoYo, Tencent ACE, Vanguard, FACEIT).
- `AntiCheatDetector.PROTECTED_EXES` games whose protection lives in a driver
  or service, known by exe name.

## Why

Kernel anti-cheat reads the "injected" flag on synthetic input and treats
automation as cheating; the account at risk is the user's. Detection never
opens the game process, because a handle with read access to a protected game
is itself what anti-cheat flags. Unreal and Unity put the real exe in
`Binaries/Win64` with the anti-cheat folder at the game root, hence two levels up.

Elevation is the other thing desktop control refuses: Windows UIPI silently
drops input a medium-integrity app sends to an elevated one, so a click would
"succeed" and do nothing. That check lives in DesktopService.
