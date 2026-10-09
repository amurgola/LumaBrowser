module.exports = {
  id: 'ninfer-runtime',
  name: 'NInfer Runtime (RTX 5090)',
  version: '1.0.0',
  description:
    'Adds NInfer, a from-scratch C++/CUDA inference server compiled for the '
    + 'RTX 5090, as an optional LLM runtime, plus the Qwen NInfer artifacts it '
    + 'loads as one-click add-on models. On Windows the server runs inside '
    + 'WSL2 (same path as the music server); on Linux it runs natively. '
    + 'Measured on one 5090 against llama.cpp: about 2x speculative decode '
    + 'and 1.3x deeper-context prefill; the trade is a closed model set.',

  private: true,
  distributable: true,

  dependencies: {},

  main: './main.js',
};
