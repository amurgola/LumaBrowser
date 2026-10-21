# resonant.js (vendor)

`core/llm-server/ui/resonant.js`

ResonantJs, the owner's reactive templating framework, copied byte for byte from
legacy as a vendor file (allowed exception: not one class per file, not a module,
and it keeps six em-dashes in its comments because the owner's rule is "copy it
unchanged"), plus one change made upstream in ResonantJs at the same time and
applied here identically: `stream(name, { patch })`, where `patch(el, html)`
writes a flush instead of `el.innerHTML = html` (the chat's live answer passes
[HtmlPatcher](js/dom/HtmlPatcher.md)`.apply`). The next vendor bump from
ResonantJs carries it; nothing else here differs from legacy.

## How modules use it

Pages load it as a classic script before their module entry:
`<script src="/llm-ui/resonant.js"></script>` (the PWA and Dashboard use the
same URL; the pop-out live page, written by LiveModuleDocument, loads it the same
way). It defines `window.Resonant` and `window.ObservableArray`. Module code
never touches those globals directly; it goes through
[ResonantRuntime](js/resonant/ResonantRuntime.md). Importing the file as a
module was rejected: module code runs in strict mode, which would change the
framework's semantics, and loading it both ways on one page would evaluate it
twice.

## Globals

Writes `window.Resonant`, `window.ObservableArray`. With `bindToWindow` (the
default) an instance also mirrors each added variable onto `window`.
