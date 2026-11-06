class AgentDeps {
  static build({ browserService, artifactStore, artifactDataStore, artifactTaskStore, mcpAggregator, ragService, db, vaultService = null }) {
    return {
      browserService,
      artifactStore,
      artifactDataStore,
      artifactTaskStore,
      mcpAggregator,
      ragService,
      db,
      vaultService,
    };
  }
}

module.exports = AgentDeps;
