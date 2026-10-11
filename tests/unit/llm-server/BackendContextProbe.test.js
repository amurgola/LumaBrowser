const http = require('http');
const Probe = require('../../../core/llm-server/chat/router/BackendContextProbe');

const config = { type: 'openai', endpoint: 'http://localhost:11434', apiKey: 'test-key' };
const ps = (name, context_length) => ({ models: [{ name, context_length }] });
function mockProbe(routes) {
  const request = jest.fn(async (options) => {
    const path = new URL(options.url).pathname;
    if (!Object.hasOwn(routes, path)) throw new Error('404');
    const route = routes[path];
    return { data: typeof route === 'function' ? await route(options) : route };
  });
  return { probe: new Probe({ request }), request };
}

test('Ollama uses the exact running allocation, preserving namespaces and tags', async () => {
  const { probe, request } = mockProbe({ '/api/ps': ps('org/qwen:latest', 131072) });
  expect(await probe.detect(config, 'org/qwen')).toEqual({ tokens: 131072, source: 'ollama' });
  expect(await probe.detect(config, 'other/qwen')).toBeNull();
  expect(await probe.detect(config, 'org/qwen:q8')).toBeNull();
  expect(request.mock.calls.some(([o]) => o.method === 'POST')).toBe(false);
});

test('a cold Ollama model loads with backend defaults, then allocation is read again', async () => {
  let loaded = false;
  const { probe, request } = mockProbe({
    '/api/ps': () => loaded ? ps('qwen:latest', 131072) : ps('different:latest', 8192),
    '/api/version': { version: '0.20.0' },
    '/api/generate': (o) => { expect(o.data).toEqual({ model: 'qwen', stream: false }); loaded = true; return { done: true }; },
  });
  const onStatus = jest.fn();
  expect(await probe.detect(config, 'qwen', { onStatus })).toEqual({ tokens: 131072, source: 'ollama' });
  expect(onStatus).toHaveBeenCalledWith({ phase: 'loading-context' });
  expect(request.mock.calls.filter(([o]) => o.url.endsWith('/api/ps'))).toHaveLength(2);
});

test('an unidentified server never receives a load request', async () => {
  const { probe, request } = mockProbe({ '/api/ps': { models: [] }, '/api/version': '<html>fallback page</html>' });
  expect(await probe.detect(config, 'qwen')).toBeNull();
  expect(request.mock.calls.every(([o]) => o.method === 'GET')).toBe(true);
});

test('failed load and older Ollama without context_length remain unknown', async () => {
  const { probe } = mockProbe({ '/api/ps': { models: [] }, '/api/version': { version: 'old' }, '/api/generate': { error: 'unavailable' } });
  expect(await probe.detect(config, 'qwen')).toBeNull();
  const old = mockProbe({ '/api/ps': ps('qwen', undefined) });
  expect(await old.probe.detect(config, 'qwen')).toBeNull();
  expect(old.request.mock.calls.every(([o]) => o.method === 'GET')).toBe(true);
});

test.each([0, -1, 1.5, '131072', true, null, Number.MAX_SAFE_INTEGER + 1])('rejects invalid context %p', async (value) => {
  const { probe } = mockProbe({ '/api/ps': ps('qwen', value) });
  expect(await probe.detect(config, 'qwen')).toBeNull();
});

test('LM Studio uses loaded instance config, not maximum or parallel divisor', async () => {
  const { probe } = mockProbe({ '/api/v1/models': { models: [{
    type: 'llm', key: 'org/qwen', max_context_length: 262144,
    loaded_instances: [
      { id: 'qwen-large', config: { context_length: 131072, parallel: 4 } },
      { id: 'qwen-small', config: { context_length: 32768 } },
    ],
  }] } });
  expect(await probe.detect(config, 'qwen-large')).toEqual({ tokens: 131072, source: 'lm-studio' });
  expect(await probe.detect(config, 'org/qwen')).toEqual({ tokens: 32768, source: 'lm-studio' });
  expect(await probe.detect(config, 'qwen')).toBeNull();
});

test('unloaded LM Studio and incomplete instance data do not advertise a maximum as allocation', () => {
  const model = { type: 'llm', key: 'qwen', max_context_length: 262144, loaded_instances: [] };
  expect(Probe.lmStudio({ models: [model] }, 'qwen')).toBeNull();
  model.loaded_instances = [{ config: { context_length: 131072 } }, { config: {} }];
  expect(Probe.lmStudio({ models: [model] }, 'qwen')).toBeNull();
});

test('llama.cpp per-slot n_ctx requires a matching single-model endpoint', async () => {
  const routes = { '/v1/models': { data: [{ id: 'qwen', meta: { n_ctx_train: 262144 } }] },
    '/props': { default_generation_settings: { n_ctx: 32768 }, total_slots: 4 } };
  const { probe } = mockProbe(routes);
  expect(await probe.detect(config, 'qwen')).toEqual({ tokens: 32768, source: 'llama.cpp' });
  expect(await probe.detect(config, 'other')).toBeNull();
  routes['/v1/models'].data.push({ id: 'other' });
  expect(await probe.detect(config, 'qwen')).toBeNull();
});

test('paired peers use fresh advertised context without native backend probing', async () => {
  const { probe, request } = mockProbe({ '/v1/models': { data: [{ id: 'qwen', luma_context: 65536 }] } });
  expect(await probe.detect({ ...config, peerManaged: true }, 'qwen')).toEqual({ tokens: 65536, source: 'provider' });
  expect(request).toHaveBeenCalledTimes(1);
});

test('preserves path prefixes and auth, bounds requests, and forbids redirects', async () => {
  const { probe, request } = mockProbe({ '/gateway/api/ps': ps('qwen', 131072) });
  await probe.detect({ ...config, endpoint: 'https://example.test/gateway/' }, 'qwen');
  for (const [options] of request.mock.calls) {
    expect(options.url).toMatch(/^https:\/\/example.test\/gateway\//);
    expect(options.headers.Authorization).toBe('Bearer test-key');
    expect(options.timeout).toBe(2000);
    expect(options.maxRedirects).toBe(0);
  }
});

test.each(['file:///tmp/foo', 'http://user:pass@host', 'http://host?secret=x', 'invalid'])('does not probe invalid endpoint %s', async (endpoint) => {
  const { probe, request } = mockProbe({});
  expect(await probe.detect({ ...config, endpoint }, 'qwen')).toBeNull();
  expect(request).not.toHaveBeenCalled();
});

test('does not send OpenAI auth to native routes for a non-OpenAI provider', async () => {
  const { probe, request } = mockProbe({});
  expect(await probe.detect({ ...config, type: 'anthropic' }, 'qwen')).toBeNull();
  expect(request).not.toHaveBeenCalled();
});

describe('real HTTP transport', () => {
  let server;
  let endpoint;
  beforeEach(async () => {
    server = http.createServer();
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    endpoint = `http://127.0.0.1:${server.address().port}`;
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  });

  test('reads model allocation through authenticated HTTP', async () => {
    server.on('request', (req, res) => {
      expect(req.headers.authorization).toBe('Bearer test-key');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.url === '/api/ps' ? ps('qwen', 131072) : {}));
    });
    expect(await new Probe().detect({ ...config, endpoint }, 'qwen')).toEqual({ tokens: 131072, source: 'ollama' });
  });

  test('cancellation aborts a hanging discovery instead of returning a fallback', async () => {
    const controller = new AbortController();
    server.once('request', () => controller.abort());
    await expect(new Probe().detect({ ...config, endpoint }, 'qwen', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('a timed-out discovery returns unknown', async () => {
    const previous = Probe.PROBE_TIMEOUT_MS;
    Probe.PROBE_TIMEOUT_MS = 30;
    try { expect(await new Probe().detect({ ...config, endpoint }, 'qwen')).toBeNull(); }
    finally { Probe.PROBE_TIMEOUT_MS = previous; }
  });
});
