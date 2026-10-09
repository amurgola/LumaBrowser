class AgentDeps {
  static build({ browserService, artifactStore, artifactDataStore, artifactTaskStore, mcpAggregator, ragService, db }) {
    return {
      browserService,
      artifactStore,
      artifactDataStore,
      artifactTaskStore,
      mcpAggregator,
      ragService,
      db,
    };
  }
}

module.exports = AgentDeps;
