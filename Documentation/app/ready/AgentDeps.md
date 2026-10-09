# AgentDeps

`app/ready/AgentDeps.js`

The dependencies of the agentic chat, scheduled runs, triggers, the live page API
and placement's test, published as `ctx.agentDeps` once the browser and the
extensions exist (null before; readers degrade).

## Methods

- `AgentDeps.build({ browserService, artifactStore, artifactDataStore, artifactTaskStore, mcpAggregator, ragService, db })`
  returns exactly those.
