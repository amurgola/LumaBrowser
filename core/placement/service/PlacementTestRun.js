const BestEffort = require('./BestEffort');
const PlacementTestTurn = require('./PlacementTestTurn');

class PlacementTestRun {
  static GENERATE_MESSAGE = 'Use the generate_image tool to create a picture of a fluffy cat.';
  static EDIT_MESSAGE = 'Use the edit_image tool to give the cat a big funny party hat.';
  static NO_ROUTER_ERROR = 'Chat router unavailable.';
  static NO_MODEL_ERROR = 'No LLM model configured.';

  static editMessageFor(imageId) {
    return imageId
      ? `Use the edit_image tool on image artifact ${imageId} to give the cat a big funny party hat.`
      : PlacementTestRun.EDIT_MESSAGE;
  }

  constructor({ getChatRouter, getArtifactStore, createSampler, recorder, slotInfo, finalState, clock = Date.now }) {
    this._getChatRouter = getChatRouter;
    this._getArtifactStore = getArtifactStore;
    this._createSampler = createSampler;
    this._recorder = recorder;
    this._slotInfo = slotInfo;
    this._finalState = finalState;
    this._clock = clock;
  }

  async run(send) {
    const emit = typeof send === 'function' ? send : () => {};
    const router = this._getChatRouter();
    if (!router || typeof router.chat !== 'function') return { success: false, error: PlacementTestRun.NO_ROUTER_ERROR };
    const modelRef = PlacementTestRun._modelRefOf(router);
    if (!modelRef) return { success: false, error: PlacementTestRun.NO_MODEL_ERROR };
    return this._runTurns({ router, modelRef, emit });
  }

  async _runTurns({ router, modelRef, emit }) {
    const steps = [];
    const shared = { router, modelRef, emit, steps, artifactStore: BestEffort.read(() => this._getArtifactStore()) };
    const sampler = this._createSampler();
    const startedAt = this._clock();
    try {
      const generated = await this._runTurn(shared, 'generate', PlacementTestRun.GENERATE_MESSAGE, undefined);
      await this._runTurn(shared, 'edit', PlacementTestRun.editMessageFor(generated.imageId), generated.convId);
      const totalMs = this._clock() - startedAt;
      const result = this._succeed({ steps, totalMs, conversationId: generated.convId, vram: sampler.stop() });
      emit('done', result);
      return result;
    } catch (err) {
      const vram = BestEffort.read(() => sampler.stop());
      emit('error', { message: err && err.message });
      return { success: false, error: err && err.message, steps, vram };
    }
  }

  async _runTurn({ router, modelRef, emit, steps, artifactStore }, label, message, conversationId) {
    const turn = new PlacementTestTurn({ router, modelRef, artifactStore, emit, clock: this._clock });
    const outcome = await turn.run(label, message, conversationId);
    steps.push(outcome.step);
    return outcome;
  }

  _succeed({ steps, totalMs, conversationId, vram }) {
    BestEffort.read(() => this._recorder.record(vram));
    const placement = this._slotInfo.build();
    const { measured, canApply } = this._finalState();
    return { success: true, steps, totalMs, conversationId, vram, placement, measured, canApply };
  }

  static _modelRefOf(router) {
    return BestEffort.read(() => router.listModels().defaultRef)
      || BestEffort.read(() => {
        const models = router.listModels().models || [];
        return models[0] && models[0].ref;
      });
  }
}

module.exports = PlacementTestRun;
