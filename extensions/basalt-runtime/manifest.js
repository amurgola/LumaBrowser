module.exports = {
  id: 'basalt-runtime',
  name: 'Basalt Runtime (NVIDIA RTX 50, 40, 30)',
  version: '1.4.0',
  description:
    'Adds Basalt as an optional LLM runtime: a C++/CUDA engine with its own OpenAI-compatible '
    + 'server, running natively on Windows and Linux, plus its five .basalt model packs as '
    + 'one-click add-on models. Two builds to choose from. The upstream build is the unmodified '
    + 'release of github.com/jesdga95/basalt and runs on RTX 50 series cards only. The LumaByte '
    + 'build comes from the fork at github.com/amurgola/basalt and also runs on RTX 40 and RTX 30 '
    + 'series cards, as the only card, the main card or a second card (measured on an RTX 3090: '
    + 'far slower at reading prompts than an RTX 50). The install fetches the release, builds the server\'s Python '
    + 'environment and supplies the CUDA 13 runtime. Measured on one 5090 with Qwen3.8-27B (NVFP4 '
    + 'here, Q6_K on llama.cpp): about 1.7x drafted decode and 4x prompt reading.',

  distributable: true,

  dependencies: {},

  main: './main.js',
};
