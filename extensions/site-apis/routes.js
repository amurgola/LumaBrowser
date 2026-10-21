const express = require('express');

const FAULT_STATUS = 422;

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = context.extensionApi;

  const failed = (res, status, error, err) => res.status(status).json({ success: false, error, message: err && err.message });

  const siteOr404 = (req, res) => {
    const site = api.getSite(req.params.site);
    if (!site) res.status(404).json({ success: false, error: 'Site not found' });
    return site;
  };

  const endpointOr404 = (req, res) => {
    const site = siteOr404(req, res);
    if (!site) return null;
    const endpoint = api.listEndpoints(site.id).find((e) => e.name === req.params.name) || null;
    if (!endpoint) res.status(404).json({ success: false, error: 'Endpoint not found' });
    return endpoint;
  };

  router.get('/sites', (req, res) => {
    try {
      const sites = api.listSites();
      res.json({ success: true, sites, count: sites.length });
    } catch (err) {
      failed(res, 500, 'Failed to list sites', err);
    }
  });

  router.get('/sites/:site', (req, res) => {
    try {
      const site = siteOr404(req, res);
      if (site) res.json({ success: true, site: { ...site, endpoints: api.listEndpoints(site.id) } });
    } catch (err) {
      failed(res, 500, 'Failed to read the site', err);
    }
  });

  router.delete('/sites/:site', (req, res) => {
    try {
      const site = siteOr404(req, res);
      if (!site) return;
      api.deleteSite(site.id);
      res.json({ success: true, message: 'Site deleted' });
    } catch (err) {
      failed(res, 500, 'Failed to delete the site', err);
    }
  });

  router.get('/sites/:site/endpoints', (req, res) => {
    try {
      const site = siteOr404(req, res);
      if (!site) return;
      const endpoints = api.listEndpoints(site.id);
      res.json({ success: true, endpoints, count: endpoints.length });
    } catch (err) {
      failed(res, 500, 'Failed to list endpoints', err);
    }
  });

  router.get('/sites/:site/endpoints/:name', (req, res) => {
    try {
      const endpoint = endpointOr404(req, res);
      if (endpoint) res.json({ success: true, endpoint });
    } catch (err) {
      failed(res, 500, 'Failed to read the endpoint', err);
    }
  });

  router.delete('/sites/:site/endpoints/:name', (req, res) => {
    try {
      const endpoint = endpointOr404(req, res);
      if (!endpoint) return;
      api.deleteEndpoint(endpoint.id);
      res.json({ success: true, message: 'Endpoint deleted' });
    } catch (err) {
      failed(res, 500, 'Failed to delete the endpoint', err);
    }
  });

  router.post('/sites/:site/endpoints/:name/run', async (req, res) => {
    try {
      const endpoint = endpointOr404(req, res);
      if (!endpoint) return;
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const params = body.params && typeof body.params === 'object' ? body.params : body;
      const result = await api.run(req.params.site, endpoint.name, params, { kind: 'call' });
      res.status(result && result.success ? 200 : FAULT_STATUS).json(result);
    } catch (err) {
      failed(res, 500, 'Failed to run the endpoint', err);
    }
  });

  router.get('/runs/:id', (req, res) => {
    try {
      const run = api.getRun(req.params.id);
      if (!run) return res.status(404).json({ success: false, error: 'Run not found' });
      res.json({ success: true, run });
    } catch (err) {
      failed(res, 500, 'Failed to read the run', err);
    }
  });

  router.post('/sites/:site/show-tab', (req, res) => {
    try {
      const site = siteOr404(req, res);
      if (!site) return;
      const shown = api.showSiteTab(site.id);
      res.status(shown && shown.success ? 200 : 409).json(shown);
    } catch (err) {
      failed(res, 500, 'Failed to show the tab', err);
    }
  });

  return router;
};
