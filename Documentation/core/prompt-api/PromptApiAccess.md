# PromptApiAccess

`core/prompt-api/PromptApiAccess.js`

Whether a page may use the local model through the web Prompt API, for
[PromptApiService](PromptApiService.md). The app's own pages may; a website
needs the user's answer, asked in its tab like camera access (Allow once,
Always allow, Block) and remembered per site by the installed
[PermissionManager](../browser/PermissionManager.md) under the kind
`PermissionKinds.LOCAL_MODEL` (`'localModel'`). Without a policy, or for a page
that is gone, the answer is no.

## Methods

- `new PromptApiAccess({ getPermissions, pageById })`: `getPermissions()` returns
  the installed PermissionManager or null (default `PermissionManager.current()`);
  `pageById(id)` returns the webContents or null (default Electron's
  `webContents.fromId`, resolved lazily).
- `blocked(origin)` true when the user answered Block for this site
  (`siteBlocked`); the page is then told no model is available, without a prompt.
  False without a policy.
- `allowed({ webContentsId, origin })` resolves whether the page may use the
  model, through `decideSiteAccess` on its webContents, which prompts the user
  when the site has no answer yet. False without a policy, or when the page is
  missing or destroyed.
