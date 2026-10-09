class UiaHostScript {
  static SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
namespace Luma {
  public static class Native {
    [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr v);
    public delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr parent, EnumProc cb, IntPtr l);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder sb, int n);
    [DllImport("oleacc.dll")] static extern int AccessibleObjectFromWindow(IntPtr h, uint id, ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object o);
    public static string ClassOf(IntPtr h) { var sb = new StringBuilder(256); GetClassName(h, sb, 256); return sb.ToString(); }
    public static List<IntPtr> ChildrenOfClass(IntPtr parent, string cls) {
      var list = new List<IntPtr>();
      EnumProc cb = (h, l) => { if (ClassOf(h) == cls) list.Add(h); return true; };
      EnumChildWindows(parent, cb, IntPtr.Zero);
      GC.KeepAlive(cb);
      return list;
    }
    // The MSAA client object, requested the way a screen reader does
    // (WM_GETOBJECT / OBJID_CLIENT). True when the window answered.
    public static bool TouchMsaa(IntPtr h) {
      Guid iid = new Guid("618736E0-3C3D-11CF-810C-00AA00389B71");
      object o = null;
      int hr = AccessibleObjectFromWindow(h, 0xFFFFFFFC, ref iid, out o);
      if (hr != 0 || o == null) return false;
      Marshal.ReleaseComObject(o);
      return true;
    }
  }
}
'@
# Per-monitor v2 DPI awareness, so UIA rectangles are physical pixels (the
# same space as GetWindowRect and SetCursorPos on the Node side).
[void][Luma.Native]::SetProcessDpiAwarenessContext([IntPtr]::new(-4))

$AE = [System.Windows.Automation.AutomationElement]
$Auto = [System.Windows.Automation.Automation]
$Walker = [System.Windows.Automation.TreeWalker]::RawViewWalker
$refs = @{}
$interactive = @('Button','Edit','CheckBox','ComboBox','ListItem','MenuItem','TabItem','Hyperlink','RadioButton','TreeItem','Slider','SplitButton','DataItem','Spinner','Document','MenuBar','ScrollBar')
$patternProps = [ordered]@{
  invoke = $AE::IsInvokePatternAvailableProperty
  toggle = $AE::IsTogglePatternAvailableProperty
  value = $AE::IsValuePatternAvailableProperty
  select = $AE::IsSelectionItemPatternAvailableProperty
  expand = $AE::IsExpandCollapsePatternAvailableProperty
  range = $AE::IsRangeValuePatternAvailableProperty
}

function Reply($obj) {
  [Console]::Out.WriteLine(($obj | ConvertTo-Json -Compress -Depth 6))
  [Console]::Out.Flush()
}

function RectOf($r) {
  if ($r.IsEmpty) { return $null }
  return @([int]$r.X, [int]$r.Y, [int]$r.Width, [int]$r.Height)
}

function Tree($req) {
  $refs.Clear()
  $root = $AE::FromHandle([IntPtr]::new([long]$req.hwnd))
  $cr = New-Object System.Windows.Automation.CacheRequest
  foreach ($p in @($AE::NameProperty, $AE::ControlTypeProperty, $AE::BoundingRectangleProperty, $AE::AutomationIdProperty, $AE::IsEnabledProperty, $AE::IsOffscreenProperty)) { $cr.Add($p) }
  foreach ($p in $patternProps.Values) { $cr.Add($p) }
  $cr.TreeFilter = [System.Windows.Automation.Automation]::ControlViewCondition
  $scope = $cr.Activate()
  try {
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Automation]::ControlViewCondition)
  } finally { $scope.Dispose() }
  $max = if ($req.maxNodes) { [int]$req.maxNodes } else { 300 }
  $nodes = New-Object System.Collections.ArrayList
  $n = 0
  foreach ($el in $all) {
    $c = $el.Cached
    if ($c.IsOffscreen) { continue }
    $r = $c.BoundingRectangle
    if ($r.IsEmpty -or $r.Width -lt 2 -or $r.Height -lt 2) { continue }
    $role = $c.ControlType.ProgrammaticName -replace '^ControlType\.', ''
    $pats = @()
    foreach ($k in $patternProps.Keys) { if ($el.GetCachedPropertyValue($patternProps[$k]) -eq $true) { $pats += $k } }
    if (-not ($interactive -contains $role) -and $pats.Count -eq 0) { continue }
    $n++
    if ($n -gt $max) { break }
    $refs[$n] = $el
    [void]$nodes.Add([ordered]@{
      ref = $n; role = $role; name = [string]$c.Name
      rect = @([int]$r.X, [int]$r.Y, [int]$r.Width, [int]$r.Height)
      aid = [string]$c.AutomationId; enabled = [bool]$c.IsEnabled; patterns = $pats
    })
  }
  Reply ([ordered]@{ id = $req.id; ok = $true; nodes = $nodes; truncated = ($n -gt $max) })
}

function Pattern($el, $pattern) {
  $out = $null
  if ($el.TryGetCurrentPattern($pattern, [ref]$out)) { return $out }
  return $null
}

# Where a ref is now, scrolling it into view first when it went offscreen
# (a list scrolled since the observe): a pointer click at a stale or
# offscreen rectangle would land on whatever is there instead.
function Locate($el) {
  $scrolled = $false
  if ($el.Current.IsOffscreen) {
    $si = Pattern $el ([System.Windows.Automation.ScrollItemPattern]::Pattern)
    if ($si) {
      try { $si.ScrollIntoView(); $scrolled = $true; Start-Sleep -Milliseconds 150 } catch { }
    }
  }
  $cur = $el.Current
  return @{ rect = (RectOf $cur.BoundingRectangle); offscreen = [bool]$cur.IsOffscreen; scrolled = $scrolled }
}

# Slider / spinner / progress-like controls: RangeValuePattern takes a number;
# anything else with a ValuePattern takes the text.
function SetRange($req, $el) {
  $num = 0.0
  $isNum = [double]::TryParse([string]$req.value, [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$num)
  $rp = Pattern $el ([System.Windows.Automation.RangeValuePattern]::Pattern)
  if ($rp -and $isNum) {
    $c = $rp.Current
    if ($c.IsReadOnly) { Reply @{ id = $req.id; ok = $false; error = 'this control is read-only' }; return }
    if ($num -lt $c.Minimum -or $num -gt $c.Maximum) {
      Reply @{ id = $req.id; ok = $false; error = "value $num is outside this control's range $($c.Minimum)..$($c.Maximum)" }; return
    }
    $rp.SetValue($num)
    $after = $rp.Current
    Reply @{ id = $req.id; ok = $true; done = 'rangeValue'; value = $after.Value; min = $after.Minimum; max = $after.Maximum }; return
  }
  $vp = Pattern $el ([System.Windows.Automation.ValuePattern]::Pattern)
  if ($vp) {
    if ($vp.Current.IsReadOnly) { Reply @{ id = $req.id; ok = $false; error = 'this control is read-only' }; return }
    $vp.SetValue([string]$req.value)
    Reply @{ id = $req.id; ok = $true; done = 'setValue'; value = [string]$vp.Current.Value }; return
  }
  $why = if ($rp) { 'this control takes a number' } else { 'this control has no RangeValue or Value pattern; use desktop_click / desktop_drag instead' }
  Reply @{ id = $req.id; ok = $false; error = $why }
}

function Act($req) {
  $el = $refs[[int]$req.ref]
  if ($null -eq $el) { Reply @{ id = $req.id; ok = $false; error = "ref $($req.ref) is not in the last observation; observe again" }; return }
  $action = [string]$req.action
  if ($action -eq 'setValue') {
    $vp = Pattern $el ([System.Windows.Automation.ValuePattern]::Pattern)
    if ($vp) { $vp.SetValue([string]$req.value); Reply @{ id = $req.id; ok = $true; done = 'setValue' }; return }
  } elseif ($action -eq 'setRange') {
    SetRange $req $el; return
  } elseif ($action -eq 'locate') {
    $loc = Locate $el
    Reply @{ id = $req.id; ok = $true; done = 'locate'; rect = $loc.rect; offscreen = $loc.offscreen; scrolled = $loc.scrolled }; return
  } elseif ($action -eq 'focus') {
    $el.SetFocus(); Reply @{ id = $req.id; ok = $true; done = 'focus' }; return
  } else {
    # 'click': the least intrusive pattern that means "activate".
    $ip = Pattern $el ([System.Windows.Automation.InvokePattern]::Pattern)
    if ($ip) { $ip.Invoke(); Reply @{ id = $req.id; ok = $true; done = 'invoke' }; return }
    $tp = Pattern $el ([System.Windows.Automation.TogglePattern]::Pattern)
    if ($tp) { $tp.Toggle(); Reply @{ id = $req.id; ok = $true; done = 'toggle' }; return }
    $sp = Pattern $el ([System.Windows.Automation.SelectionItemPattern]::Pattern)
    if ($sp) { $sp.Select(); Reply @{ id = $req.id; ok = $true; done = 'select' }; return }
    $ep = Pattern $el ([System.Windows.Automation.ExpandCollapsePattern]::Pattern)
    if ($ep) {
      if ($ep.Current.ExpandCollapseState -eq 'Collapsed') { $ep.Expand() } else { $ep.Collapse() }
      Reply @{ id = $req.id; ok = $true; done = 'expandCollapse' }; return
    }
  }
  # No pattern: the caller falls back to real pointer/keyboard input here.
  $loc = Locate $el
  Reply @{ id = $req.id; ok = $true; needsPointer = $true; rect = $loc.rect; offscreen = $loc.offscreen; scrolled = $loc.scrolled }
}

# Switch on a Chromium/Electron window's web-content accessibility (see the
# findings at the top of uiaHostScript.js): ask the render widget children
# (and the frame) for their MSAA and UIA roots, the way a screen reader does.
function Wake($req) {
  $top = [IntPtr]::new([long]$req.hwnd)
  $widgets = @([Luma.Native]::ChildrenOfClass($top, 'Chrome_RenderWidgetHostHWND'))
  $msaa = 0
  foreach ($h in (@($top) + $widgets)) {
    try { if ([Luma.Native]::TouchMsaa($h)) { $msaa++ } } catch { }
    try {
      $e = $AE::FromHandle($h)
      [void]$e.Current.Name
      [void]$e.FindFirst([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
    } catch { }
  }
  Reply @{ id = $req.id; ok = $true; widgets = $widgets.Count; msaa = $msaa }
}

# What is actually under a screen point, and (with ref) how it relates to the
# ref's element: self | descendant (a label inside the button) | ancestor (the
# container answered for a non-hit-testable child) | other (something else is
# on top). top = the top-level window that owns the element.
function Hit($req) {
  $el = $AE::FromPoint([System.Windows.Point]::new([double]$req.x, [double]$req.y))
  $root = $AE::RootElement
  $chain = New-Object System.Collections.ArrayList
  $p = $Walker.GetParent($el)
  $i = 0
  while ($null -ne $p -and $i -lt 80) {
    if ($Auto::Compare($p, $root)) { break }
    [void]$chain.Add($p)
    $p = $Walker.GetParent($p)
    $i++
  }
  $topEl = if ($chain.Count) { $chain[$chain.Count - 1] } else { $el }
  $c = $el.Current
  $rid = $null
  try { $rid = ($el.GetRuntimeId()) -join '.' } catch { }
  $out = [ordered]@{
    id = $req.id; ok = $true; name = [string]$c.Name
    role = ($c.ControlType.ProgrammaticName -replace '^ControlType\.', '')
    rect = (RectOf $c.BoundingRectangle); rid = $rid; pid = [int]$c.ProcessId
    top = [long]$topEl.Current.NativeWindowHandle
  }
  if ($null -ne $req.ref) {
    $t = $refs[[int]$req.ref]
    if ($null -ne $t) {
      $rel = 'other'
      if ($Auto::Compare($el, $t)) { $rel = 'self' }
      else {
        foreach ($a in $chain) { if ($Auto::Compare($a, $t)) { $rel = 'descendant'; break } }
        if ($rel -eq 'other') {
          $q = $Walker.GetParent($t)
          $j = 0
          while ($null -ne $q -and $j -lt 80) {
            if ($Auto::Compare($q, $el)) { $rel = 'ancestor'; break }
            $q = $Walker.GetParent($q)
            $j++
          }
        }
      }
      $out.relation = $rel
    }
  }
  Reply $out
}

Reply @{ id = 0; ok = $true; ready = $true }
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if (-not $line.Trim()) { continue }
  $req = $null
  try {
    $req = $line | ConvertFrom-Json
    switch ($req.cmd) {
      'ping' { Reply @{ id = $req.id; ok = $true } }
      'tree' { Tree $req }
      'act' { Act $req }
      'wake' { Wake $req }
      'hit' { Hit $req }
      default { Reply @{ id = $req.id; ok = $false; error = "unknown cmd $($req.cmd)" } }
    }
  } catch {
    $rid = if ($req) { $req.id } else { -1 }
    Reply @{ id = $rid; ok = $false; error = $_.Exception.Message }
  }
}
`;
}

module.exports = UiaHostScript;
