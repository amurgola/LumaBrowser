class ChatToolHandler {
  names() {
    throw new Error(`${this.constructor.name} must implement names()`);
  }

  async execute(_name, _params, _ctx) {
    throw new Error(`${this.constructor.name} must implement execute()`);
  }

  static publish(ctx, artifact) {
    ctx.artifacts.push(artifact);
    if (ctx.hooks.onArtifact) ctx.hooks.onArtifact(artifact);
  }
}

module.exports = ChatToolHandler;
