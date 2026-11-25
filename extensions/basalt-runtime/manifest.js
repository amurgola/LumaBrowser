module.exports = {
  id: 'basalt-runtime',
  name: 'Basalt Runtime (NVIDIA RTX 50)',
  version: '1.3.1',
  description:
    'Adds Basalt as an optional LLM runtime: a C++/CUDA engine with its own OpenAI-compatible '
    + 'server, running natively on Windows and Linux, plus its five .basalt model packs as '
    + 'one-click add-on models. Two builds to choose from. The upstream build is the unmodified '
    + 'release of github.com/jesdga95/basalt and runs on RTX 50 series cards only. The LumaByte '
    + 'build comes from the fork at github.com/amurgola/basalt: it still needs an RTX 50 series '
    + 'main card, and can also use an RTX 40 or RTX 30 series second card to hold experts for '
    + 'Qwen3.8 Flash Next. The install fetches the release, builds the server\'s Python '
    + 'environment and supplies the CUDA 13 runtime. Measured on one 5090 with Qwen3.8-27B (NVFP4 '
    + 'here, Q6_K on llama.cpp): about 1.7x drafted decode and 4x prompt reading.',

  distributable: true,

  dependencies: {},

  main: './main.js',
};
