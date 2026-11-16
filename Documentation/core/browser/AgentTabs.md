# AgentTabs

`core/browser/AgentTabs.js`

Tabs as the automation and AI surfaces get them: without the favicon image the tab strip carries inline,
and with the user's hidden persisted tabs listed only when asked for by name. Used by the MCP tools
([BrowserMcpTools](BrowserMcpTools.md)), the REST controller ([BrowserController](BrowserController.md))
and the chat tools ([BrowserToolExecutor](../llm-service/tools/BrowserToolExecutor.md)).

## Methods

- `AgentTabs.fetchOptions(request)`: the options for the tab manager's list call,
  `{ includeSilent }`. True when the request wants silent tabs or hidden tabs, because the tab manager
  lists both under its one `includeSilent` flag.
- `AgentTabs.select(tabs, request)`: the tabs the request asked for, each shaped. A tab in the strip is
  always listed; a silent tab (a background tab an agent opened) only with `includeSilent`; a hidden tab
  (a persisted tab living off the strip, such as mail or chat) only with `includeHidden`. A missing list
  is an empty one.
- `AgentTabs.shape(tab)`: a copy with `favicon: null` when the favicon is a `data:` URL; the same object
  otherwise (an icon URL is kept, and so is a tab with no favicon).
- `INLINE_IMAGE`: the `data:` test.

Flags count as set when they are `true` or the string `'true'`: MCP and chat tools send booleans, REST
sends query strings.

## Why

The tab state the strip renders from ([TabStateChannel](tab-view/TabStateChannel.md)) carries each site's
cached favicon as a base64 data URL, up to tens of kilobytes a tab. Passed on to an agent, a list of a
dozen tabs was over 200,000 characters, almost all of it icons the agent cannot use.

Silent tabs and hidden persisted tabs are different things that the tab manager lists together. An agent
asking for the background tabs it opened has no reason to be handed the user's mail and chat tabs, so
those need their own flag. The tab manager's own list is unchanged: extensions that work with persisted
tabs still get them through `context.browser.getTabs({ includeSilent: true })`.
