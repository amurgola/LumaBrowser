param(
  [Parameter(Mandatory = $true)][int]$ProcId,
  [int]$Seconds = 12,
  [int]$StartDelayMs = 2500
)

$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  // Windows only lets the foreground owner (or a thread attached to it)
  // hand focus over: attach to whoever owns the foreground, then switch.
  public static bool Focus(IntPtr hWnd) {
    IntPtr fg = GetForegroundWindow();
    uint fgThread = GetWindowThreadProcessId(fg, IntPtr.Zero);
    uint me = GetCurrentThreadId();
    bool attached = fgThread != 0 && fgThread != me && AttachThreadInput(me, fgThread, true);
    keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero); // tap ALT
    bool ok = SetForegroundWindow(hWnd);
    BringWindowToTop(hWnd);
    if (attached) AttachThreadInput(me, fgThread, false);
    return ok && GetForegroundWindow() == hWnd;
  }
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int w, int h, bool repaint);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  public const uint LEFTDOWN = 0x02, LEFTUP = 0x04, MOVE = 0x01;
}
"@

Start-Sleep -Milliseconds $StartDelayMs

function Get-MainHwnd {
  for ($i = 0; $i -lt 40; $i++) {
    $p = Get-Process -Id $ProcId -ErrorAction SilentlyContinue
    if (-not $p) { return [IntPtr]::Zero }
    if ($p.MainWindowHandle -ne 0) { return $p.MainWindowHandle }
    Start-Sleep -Milliseconds 250
  }
  return [IntPtr]::Zero
}

$hwnd = Get-MainHwnd
if ($hwnd -eq [IntPtr]::Zero) { Write-Output "interact: no main window for pid $ProcId"; exit 0 }

[Win32]::ShowWindow($hwnd, 9) | Out-Null   # SW_RESTORE
$focused = [Win32]::Focus($hwnd)
Write-Output "interact: window $hwnd focused=$focused"
$idle = 0

function Click([int]$x, [int]$y) {
  [Win32]::SetCursorPos($x, $y) | Out-Null
  Start-Sleep -Milliseconds 40
  [Win32]::mouse_event([Win32]::LEFTDOWN, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 40
  [Win32]::mouse_event([Win32]::LEFTUP, 0, 0, 0, [UIntPtr]::Zero)
}

$deadline = (Get-Date).AddSeconds($Seconds)
$round = 0
while ((Get-Date) -lt $deadline) {
  if (-not (Get-Process -Id $ProcId -ErrorAction SilentlyContinue)) { Write-Output "interact: process gone"; exit 0 }
  $r = New-Object Win32+RECT
  if (-not [Win32]::GetWindowRect($hwnd, [ref]$r)) { break }
  $w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top
  if ($w -lt 200 -or $h -lt 200) { $idle++; Start-Sleep -Milliseconds 300; continue }
  if ([Win32]::GetForegroundWindow() -ne $hwnd) {
    if (-not [Win32]::Focus($hwnd)) { $idle++; Start-Sleep -Milliseconds 500; continue }
  }

  for ($x = $r.Left + 20; $x -lt $r.Right - 20; $x += 60) {
    [Win32]::SetCursorPos($x, $r.Top + 20) | Out-Null
    Start-Sleep -Milliseconds 15
  }
  for ($y = $r.Top + 20; $y -lt $r.Bottom - 20; $y += 80) {
    [Win32]::SetCursorPos($r.Left + [int]($w / 2), $y) | Out-Null
    Start-Sleep -Milliseconds 15
  }

  switch ($round % 4) {
    0 {
      Click ($r.Left + [int]($w / 2)) ($r.Top + 52)
      [System.Windows.Forms.SendKeys]::SendWait("^l")
      Start-Sleep -Milliseconds 80
      [System.Windows.Forms.SendKeys]::SendWait("example.com{ENTER}")
    }
    1 {
      [System.Windows.Forms.SendKeys]::SendWait("^t")
      Start-Sleep -Milliseconds 400
      [System.Windows.Forms.SendKeys]::SendWait("^w")
    }
    2 {
      [Win32]::MoveWindow($hwnd, $r.Left + 30, $r.Top + 30, $w - 120, $h - 80, $true) | Out-Null
      Start-Sleep -Milliseconds 300
      [Win32]::MoveWindow($hwnd, $r.Left, $r.Top, $w, $h, $true) | Out-Null
    }
    3 {
      [System.Windows.Forms.SendKeys]::SendWait("^{TAB}")
      Start-Sleep -Milliseconds 200
      Click ($r.Left + [int]($w / 2)) ($r.Top + [int]($h / 2))
      [System.Windows.Forms.SendKeys]::SendWait("^+{TAB}")
    }
  }
  $round++
  Start-Sleep -Milliseconds 350
}
Write-Output "interact: done ($round rounds, $idle idle ticks)"
