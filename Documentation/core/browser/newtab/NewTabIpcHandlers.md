# NewTabIpcHandlers

`core/browser/newtab/NewTabIpcHandlers.js`

IPC for the new tab page. The page's own calls (`core.newtab.data`, `search`, `hide`) answer only a sender whose URL is
`luma://newtab`, so no website can read the most visited sites. The chrome's calls (`core.newtab.url`, `getMode`,
`setMode`, `resetHidden`) answer only a window's browser chrome. A refused call answers null.
