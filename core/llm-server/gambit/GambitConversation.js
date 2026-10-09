const Scorer = require('../eval/Scorer');

class GambitConversation {
  constructor({ task, runTurn, emit, isAborted, progress, turnTimeoutMs }) {
    this._task = task;
    this._runTurn = runTurn;
    this._emit = emit;
    this._isAborted = isAborted;
    this._progress = progress;
    this._turnTimeoutMs = turnTimeoutMs;
    this._turns = Scorer.normalizeTurns(task);
    this._transcripts = [];
    this._priorMessages = [];
  }

  get turns() {
    return this._turns;
  }

  async play() {
    for (let index = 0; index < this._turns.length; index++) {
      if (this._isAborted()) return { transcripts: this._transcripts, aborted: true };
      const transcript = await this._playTurn(index);
      if (transcript && transcript.error) break;
    }
    return { transcripts: this._transcripts, aborted: false };
  }

  async _playTurn(index) {
    const prompt = this._turns[index].prompt;
    this._emitTurn(index);
    const transcript = await this._runTurnSafely(index, prompt);
    this._transcripts.push(transcript);
    this._remember(prompt, transcript);
    return transcript;
  }

  _emitTurn(index) {
    const { done, total } = this._progress;
    this._emit({ phase: 'turn', done, total, taskId: this._task.id, group: this._task.group, turn: index + 1, of: this._turns.length });
  }

  async _runTurnSafely(turnIndex, prompt) {
    try {
      return await this._runTurn({
        task: this._task, turnIndex, prompt, priorMessages: this._priorMessages.slice(), timeoutMs: this._turnTimeoutMs,
      });
    } catch (err) {
      return GambitConversation._failedTranscript(err);
    }
  }

  _remember(prompt, transcript) {
    const made = transcript && Array.isArray(transcript.artifacts) ? transcript.artifacts : [];
    this._priorMessages.push({ role: 'user', content: prompt });
    this._priorMessages.push({
      role: 'assistant',
      content: String((transcript && transcript.finalResponse) || ''),
      ...(made.length ? { toolCalls: { artifacts: made } } : null),
    });
  }

  static _failedTranscript(err) {
    const message = (err && err.message) || String(err);
    return {
      finalResponse: '', toolCalls: [], iterations: 0,
      error: message,
      health: { timedOut: /timed out/i.test((err && err.message) || '') },
    };
  }
}

module.exports = GambitConversation;
