const ChatTurn = require('../../../core/llm-server/chat/router/ChatTurn');
const InFlightTurn = require('../../../core/llm-server/chat/router/InFlightTurn');
const AgentTurnDispatch = require('../../../core/llm-server/chat/router/AgentTurnDispatch');
const CompactionGate = require('../../../core/llm-server/chat/router/CompactionGate');
const Compaction = require('../../../core/llm-server/chat/Compaction');
const ProxyTurns = require('../../../core/llm-server/chat/router/ProxyTurns');

const context = Object.freeze({ tokens: 131072, source: 'ollama', estimated: false });
const messages = [{ role: 'user', content: 'Hello' }];
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

function setup() {
  const bridge = { run: jest.fn(() => ({ abort: jest.fn() })) };
  const getAgentDeps = () => ({ browserService: {}, artifactStore: {} });
  const window = { forRef: () => null, resolve: jest.fn(async () => context), budgetFor: () => 4096 };
  const store = { addMessage: jest.fn(() => ({ id: 'assistant' })), updateMessage: jest.fn(), listMessages: () => [] };
  const deps = {
    chatStore: store, contextWindow: window,
    conversation: {
      open: () => ({ convId: 'conversation' }), syncTools: jest.fn(), rememberDocsSource: jest.fn(),
      resolveChoices: () => false, addUserMessage: () => ({ id: 'user' }), rememberModel: jest.fn(), pinModel: jest.fn(),
    },
    attachments: { persist: () => [] },
    modes: { resolve: jest.fn(async () => ({ descriptor: null, turn: null })) },
    reaction: { run: jest.fn() },
    compaction: { maybeCompact: jest.fn(async (m) => m) },
    thinking: { resolve: (o) => ({ messages: o.messages }) },
    dispatcher: { dispatch: jest.fn(async () => ({ abort: jest.fn() })) },
    inFlight: new InFlightTurn(), reclaimer: { cancelPending: jest.fn() },
  };
  deps.agentDispatch = new AgentTurnDispatch({
    agentBridge: bridge, chatStore: store, getAgentDeps, contextWindow: window, policy: { allowedFor: () => [] },
  });
  const send = jest.fn();
  const args = { messages, modelRef: 'provider::qwen', userMessage: 'Hello', send };
  return { deps, bridge, getAgentDeps, send, args, turn: new ChatTurn(deps) };
}

test('one resolved snapshot reaches between-turn compaction, agent budgets, and done metadata', async () => {
  const { deps, bridge, turn, args, send } = setup();
  expect((await turn.run({ ...args, agent: true })).success).toBe(true);
  expect(deps.contextWindow.resolve).toHaveBeenCalledTimes(1);
  expect(deps.compaction.maybeCompact.mock.calls[0][5]).toBe(context);
  expect(bridge.run.mock.calls[0][0].ctxPerSlot).toBe(131072);
  const hooks = bridge.run.mock.calls[0][0].hooks;
  hooks.onDone({ usage: { prompt_tokens: 100, completion_tokens: 20 } });
  expect(send).toHaveBeenCalledWith('context', { ...context, contextWindow: 131072 });
  expect(send).toHaveBeenCalledWith('done', expect.objectContaining({ contextWindow: 131072, contextSource: 'ollama', contextEstimated: false }));
});

test('plain chat resolves the model chosen by its mode before dispatch', async () => {
  const { deps, turn, args } = setup();
  deps.modes.resolve.mockResolvedValue({ descriptor: null, turn: { modelRef: 'other::model' } });
  await turn.run(args);
  expect(deps.contextWindow.resolve).toHaveBeenCalledWith('other::model', expect.any(Object));
  expect(deps.dispatcher.dispatch.mock.calls[0][0]).toBe('other::model');
});

test('Stop during context discovery prevents compaction and generation', async () => {
  const { deps, turn, args, send } = setup();
  const entered = deferred();
  deps.contextWindow.resolve.mockImplementation((ref, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    entered.resolve();
  }));
  const running = turn.run(args);
  await entered.promise;
  deps.inFlight.abort();
  expect(await running).toMatchObject({ aborted: true });
  expect(deps.compaction.maybeCompact).not.toHaveBeenCalled();
  expect(deps.dispatcher.dispatch).not.toHaveBeenCalled();
  expect(send.mock.calls.filter(([type]) => type === 'done')).toHaveLength(1);
});

test('a new turn cancels pending discovery without letting the old turn overwrite its handle', async () => {
  const { deps, turn, args } = setup();
  const entered = deferred();
  deps.contextWindow.resolve.mockImplementationOnce((ref, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    entered.resolve();
  }));
  const oldTurn = turn.run(args);
  await entered.promise;
  await new ChatTurn(deps).run(args);
  const currentHandle = deps.inFlight.handle;
  expect(await oldTurn).toMatchObject({ aborted: true });
  expect(deps.inFlight.handle).toBe(currentHandle);
  expect(deps.dispatcher.dispatch).toHaveBeenCalledTimes(1);
});

test('a 10K conversation no longer compacts against an unrelated 4K default', async () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(4000) }));
  const compaction = new Compaction();
  const compact = jest.spyOn(compaction, 'compact');
  const gate = new CompactionGate({ contextWindow: { budgetFor: () => 4096 }, compaction });
  expect(compaction.shouldCompact(history, 4096)).toBe(true);
  expect(await gate.maybeCompact(history, 'p::qwen', null, null, null, context)).toBe(history);
  expect(compact).not.toHaveBeenCalled();
});

test('shared agent turns resolve context and remain cancellable before the bridge starts', async () => {
  const { deps, bridge, getAgentDeps } = setup();
  const proxy = new ProxyTurns({ contextWindow: deps.contextWindow, agentBridge: bridge, getAgentDeps });
  const handle = proxy.agent({ modelRef: 'p::qwen', messages, hooks: {} });
  await handle.ready;
  expect(bridge.run.mock.calls[0][0].ctxPerSlot).toBe(131072);
  handle.abort();
  expect(bridge.run.mock.results[0].value.abort).toHaveBeenCalledTimes(1);
  bridge.run.mockClear();
  const waiting = deferred();
  deps.contextWindow.resolve.mockReturnValue(waiting.promise);
  const canceled = proxy.agent({ modelRef: 'p::qwen', messages, hooks: {} });
  canceled.abort();
  waiting.resolve(context);
  await canceled.ready;
  expect(bridge.run).not.toHaveBeenCalled();
});
