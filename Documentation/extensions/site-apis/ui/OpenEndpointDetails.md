# OpenEndpointDetails

`extensions/site-apis/ui/OpenEndpointDetails.js`

What the settings page remembers across a re-render: per endpoint id, which detail is open (`run` or `runs`) and
the Run form's last values and result. [SettingsPage](SettingsPage.md) owns one; [EndpointRow](EndpointRow.md)
writes to it and restores from it when it renders.

## Methods

- `open(endpoint, which)`: records the open detail; switching between Run and Runs drops the remembered result.
- `close(endpointId)`: forgets the endpoint.
- `ran(endpointId, values, result)`: stores the last run; ignored when nothing is open for the endpoint.
- `restore(endpoint)`: `{ which, values, result }` or `null`.
- `keepOnly(sites)`: forgets every endpoint not among the rendered sites.

## Decisions

- Added for ISSUES.md 2: a run's own `reload()` and the `ext.site-apis.changed` push both rebuild every card,
  which wiped the result within half a second.
- A recompiled endpoint must not show its old result. The check compares the definition (name, params, steps,
  returns, policy), not `updatedAt`: every finished run bumps `updatedAt` through the last-run summary
  (`SiteApiStore.finishRun`), so comparing it would drop the result after every run.
