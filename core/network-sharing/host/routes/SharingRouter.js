const express = require('express');
const SharingAuth = require('./SharingAuth');
const DiscoveryRoutes = require('./DiscoveryRoutes');
const GpuLendRoutes = require('./GpuLendRoutes');
const LlmRoutes = require('./LlmRoutes');
const ArtifactRoutes = require('./ArtifactRoutes');
const AgentRoutes = require('./AgentRoutes');
const MediaRoutes = require('./MediaRoutes');
const LiveTurnRegistry = require('../llm/LiveTurnRegistry');
const SharedAgents = require('../SharedAgents');

class SharingRouter {
  static create(service, { modeRegistry } = {}) {
    const router = express.Router();
    const auth = new SharingAuth(service);
    const agents = new SharedAgents(service, modeRegistry ? { modeRegistry } : {});
    router.use(auth.originPolicy);
    new DiscoveryRoutes(service, auth).mount(router);
    new GpuLendRoutes(service, auth).mount(router);
    new LlmRoutes(service, auth, { turns: new LiveTurnRegistry(), agents }).mount(router);
    new ArtifactRoutes(service, auth).mount(router);
    new AgentRoutes(auth, agents).mount(router);
    new MediaRoutes(service, auth).mount(router);
    return router;
  }
}

module.exports = SharingRouter;
