module.exports = {
  id: 'ping',
  label: 'Ping',
  description: 'GET /api/desktop/ping/ answers the app version and the enabled features, so a desktop client can test its token.',
  defaultEnabled: true,

  create(deps) {
    return {
      mount(router) {
        router.get('/', (_req, res) => {
          res.json({ success: true, version: deps.appInfo.version, features: deps.features.enabled() });
        });
      },
    };
  },
};
