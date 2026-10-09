import ArtifactViewUrl from './ArtifactViewUrl.js';

export default class TurnRecorder {
  constructor() {
    this.reasoning = '';
    this.tools = [];
    this.artifacts = [];
  }

  addReasoning(text) {
    this.reasoning += text;
  }

  record(type, payload) {
    if (type === 'tool') this._recordTool(payload);
    else if (type === 'artifact' && payload && payload.id) return this._recordArtifact(payload);
    return null;
  }

  messagePatch(content, usage) {
    const patch = { content, reasoning: this.reasoning };
    if (this.tools.length || this.artifacts.length) patch.toolCalls = { tools: this.tools, artifacts: this.artifacts };
    if (usage) {
      patch.tokensIn = usage.prompt_tokens != null ? usage.prompt_tokens : usage.input_tokens;
      patch.tokensOut = usage.completion_tokens != null ? usage.completion_tokens : usage.output_tokens;
    }
    return patch;
  }

  _recordTool(payload) {
    if (payload.phase === 'run') {
      this.tools.push({ tool: payload.tool, params: payload.params, status: 'run' });
      return;
    }
    if (payload.phase !== 'done') return;
    const open = [...this.tools].reverse().find((x) => x.tool === payload.tool && x.status === 'run');
    if (!open) return;
    open.status = payload.success ? 'ok' : 'err';
    open.error = payload.error || null;
    open.summary = payload.summary || null;
  }

  _recordArtifact(payload) {
    payload.url = ArtifactViewUrl.of(payload.id);
    const rec = { id: payload.id, title: payload.title, type: payload.type, url: payload.url };
    if (payload.rootId) rec.rootId = payload.rootId;
    if (typeof payload.version === 'number') rec.version = payload.version;
    if (payload.type === 'live') Object.assign(rec, { html: payload.html, js: payload.js, libs: payload.libs });
    this.artifacts.push(rec);
    return payload.id;
  }
}
