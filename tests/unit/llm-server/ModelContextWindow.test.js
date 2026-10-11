const ModelContextWindow = require('../../../core/llm-server/chat/router/ModelContextWindow');

function setup() {
  const config = { id: 'p', type: 'openai', endpoint: 'http://localhost:11434', models: [{ id: 'qwen', luma_context: 999999 }] };
  const probe = { detect: jest.fn().mockResolvedValue({ tokens: 131072, source: 'ollama' }) };
  const service = { getEffectiveContext: jest.fn(() => ({ ctxPerSlot: 8192 })) };
  const resolver = new ModelContextWindow({ llmServerService: service, db: { get: () => [config] }, probe });
  return { config, probe, service, resolver };
}

test('refreshes every turn and never reuses stale model metadata or a previous allocation', async () => {
  const { probe, resolver, config } = setup();
  const first = await resolver.resolve('p::qwen');
  expect(first).toEqual({ tokens: 131072, source: 'ollama', estimated: false });
  probe.detect.mockResolvedValue({ tokens: 32768, source: 'ollama' });
  config.endpoint = 'http://localhost:1234';
  expect((await resolver.resolve('p::other')).tokens).toBe(32768);
  expect(probe.detect).toHaveBeenLastCalledWith(config, 'other', {});
  expect(first.tokens).toBe(131072);
  probe.detect.mockResolvedValue(null);
  expect(await resolver.resolve('p::qwen')).toMatchObject({ tokens: 4096, source: 'fallback', estimated: true });
});

test('remote unknown context never borrows the built-in runtime settings', async () => {
  const { resolver, service, probe } = setup();
  probe.detect.mockResolvedValue(null);
  const result = await resolver.resolve('p::qwen');
  expect(result.notice).toMatch(/unknown/);
  expect(service.getEffectiveContext).not.toHaveBeenCalled();
  expect(resolver.budgetFor('p::missing')).toBe(4096);
  expect(resolver.budgetFor('local::qwen')).toBe(8192);
});

test('custom budgets are model-specific fallbacks or caps, never an increase over detection', async () => {
  const { resolver, config, probe } = setup();
  config.contextWindows = { qwen: 65536, other: 262144 };
  expect(await resolver.resolve('p::qwen')).toEqual({ tokens: 65536, source: 'custom', estimated: false });
  expect((await resolver.resolve('p::other')).tokens).toBe(131072);
  probe.detect.mockResolvedValue(null);
  expect((await resolver.resolve('p::other')).tokens).toBe(262144);
  expect((await resolver.resolve('p::missing')).source).toBe('fallback');
});

test('keeps managed local per-slot budgeting without any external request', async () => {
  const { resolver, probe } = setup();
  expect(await resolver.resolve('local::qwen')).toEqual({ tokens: 8192, source: 'local', estimated: false });
  expect(probe.detect).not.toHaveBeenCalled();
});

test.each([null, 'invalid', 'missing::qwen', 'p::'])('invalid ref %p yields explicit fallback', async (ref) => {
  expect(await setup().resolver.resolve(ref)).toMatchObject({ source: 'fallback', estimated: true });
});
