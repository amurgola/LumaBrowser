class BasaltCatalog {
  static FRAMEWORK_ID = 'basalt';
  static HUB = Object.freeze({ tag: 'basalt', extension: '.basalt' });
  static FRAMEWORK_NAME = 'Basalt';
  static UPSTREAM_RUNTIME_ID = 'basalt';
  static LUMA_RUNTIME_ID = 'basalt-luma';

  static CUDA_RUNTIME_ID = 'llama-cpp-cuda13';

  static BLACKWELL_NAME_PATTERN = 'RTX 50\\d0|RTX PRO \\d{4}.*Blackwell';

  static BINARY_NAMES = { win32: ['basalt.exe'], linux: ['basalt'] };

  static PLATFORMS = ['win32-x64', 'linux-x64'];

  static BASE_OPTIONS = ['maxConcurrent', 'kvCacheType'];

  static IDLE_SLEEP_OFF = 'off';

  static SLEEP_OPTIONS = [
    {
      id: 'idleSleep',
      label: 'Sleep when idle',
      caption: 'Gives the VRAM back while no requests come in',
      help: 'After this long without a request the model goes to sleep: its GPU memory moves to system RAM and the '
        + 'VRAM is given back to other apps. The next request wakes it in about a second. The RAM it holds while '
        + 'asleep cannot be paged out. On Windows only the dense Qwen3.8 27B pack can sleep.',
      kind: 'choice',
      choices: [
        { id: BasaltCatalog.IDLE_SLEEP_OFF, label: 'Off' },
        { id: '60', label: '1 minute' },
        { id: '300', label: '5 minutes' },
        { id: '900', label: '15 minutes' },
      ],
      default: BasaltCatalog.IDLE_SLEEP_OFF,
      ramNote: 'sleep',
    },
    {
      id: 'keepSleepRam',
      label: 'Keep sleep memory',
      caption: 'Later sleeps are faster; the RAM stays taken while awake',
      help: 'Holds the RAM a sleep uses even while the model is awake, so later sleeps are faster. That RAM cannot be '
        + 'paged out and stays taken for as long as the model is loaded. Matters only while Sleep when idle is on.',
      kind: 'toggle',
      default: false,
      ramNote: 'sleep',
    },
  ];

  static BUILDS = [
    {
      runtimeId: BasaltCatalog.LUMA_RUNTIME_ID,
      name: 'Basalt LumaByte (RTX 50 + RTX 30/40 second card)',
      repo: { owner: 'amurgola', repo: 'basalt' },
      description:
        'Cards: an NVIDIA RTX 50 series main card, which every model still needs, plus an optional RTX 50, RTX 40 '
        + 'or RTX 30 series second card that holds experts for Qwen3.8 Flash Next (measured with an RTX 3090; the '
        + 'RTX 40 path is upstream\'s and was not run). LumaByte\'s build of its Basalt fork: upstream\'s '
        + 'development branch with both older-card options compiled in and a sleep that gives the VRAM back on '
        + 'Windows. A second card is used only when the model\'s extra flags name it, such as --gpu 0,1. Loads '
        + 'the same .basalt model packs.',
      requirementNote:
        'An NVIDIA RTX 50 series main card (an RTX 40 or RTX 30 series card can only be a second card), a driver '
        + 'of the R580 branch or newer, and Python 3.10 to 3.13 for the install.',
      options: [...BasaltCatalog.BASE_OPTIONS, ...BasaltCatalog.SLEEP_OPTIONS],
      release: {
        tag: 'v0.5.6-luma.1',
        assets: {
          'win32-x64': {
            name: 'basalt-v0.5.6-luma.1-windows-x64.zip',
            bytes: 126616522,
            sha256: 'ac47622ba30221ccaca4d14ee7bc61949953be4cd27bc1857ce225f036efeca6',
          },
          'linux-x64': {
            name: 'basalt-v0.5.6-luma.1-linux-x64.tar.gz',
            bytes: 126641929,
            sha256: '148c4ad71872f0181059ff4236b7b87c1de259a76498632ddc265b227227a54c',
          },
        },
      },
    },
    {
      runtimeId: BasaltCatalog.UPSTREAM_RUNTIME_ID,
      name: 'Basalt upstream (RTX 50 only)',
      repo: { owner: 'jesdga95', repo: 'basalt' },
      description:
        'Cards: NVIDIA RTX 50 series only (Blackwell, compute capability 12.0), as the main card and as a second '
        + 'card; any older card is refused. Upstream\'s unmodified release: a C++/CUDA engine with its own '
        + 'OpenAI-compatible server, native on Windows and Linux. Loads only its own .basalt model packs: see the '
        + 'add-on models in the Models card. Windows output quality is not measured upstream.',
      requirementNote: 'An NVIDIA RTX 50 series card, a driver of the R580 branch or newer, and Python 3.10 to 3.13 for the install.',
      options: BasaltCatalog.BASE_OPTIONS,
      release: {
        tag: 'v0.5.5',
        assets: {
          'win32-x64': {
            name: 'basalt-v0.5.5-windows-x64.zip',
            bytes: 67547512,
            sha256: '6302711b30d934aaa6b9bdde6250a34ae1f4a4dcc8b247da7993d353193b71fe',
          },
          'linux-x64': {
            name: 'basalt-v0.5.5-linux-x64.tar.gz',
            bytes: 69118625,
            sha256: '89da792322248de80d9866dea87f2869fe595ed8311008572405fd3cea5b9c08',
          },
        },
      },
    },
  ];

  static RUNTIME_IDS = BasaltCatalog.BUILDS.map((build) => build.runtimeId);

  static RUNTIME_ENTRIES = BasaltCatalog.BUILDS.map((build) => BasaltCatalog._runtimeEntry(build));

  static buildFor(runtimeId) {
    return BasaltCatalog.BUILDS.find((build) => build.runtimeId === runtimeId) || null;
  }

  static sourceUrl(build) {
    return `https://github.com/${build.repo.owner}/${build.repo.repo}`;
  }

  static releaseUrl(build) {
    return `${BasaltCatalog.sourceUrl(build)}/releases/tag/${build.release.tag}`;
  }

  static assetFor(build, platformKey = `${process.platform}-${process.arch}`) {
    const asset = build.release.assets[platformKey];
    if (!asset) return null;
    return { ...asset, url: `${BasaltCatalog.sourceUrl(build)}/releases/download/${build.release.tag}/${asset.name}` };
  }

  static _runtimeEntry(build) {
    return {
      id: build.runtimeId,
      name: build.name,
      kind: 'inference',
      framework: BasaltCatalog.FRAMEWORK_ID,
      frameworkName: BasaltCatalog.FRAMEWORK_NAME,
      acquisition: 'extension',
      description: build.description,
      platforms: BasaltCatalog.PLATFORMS.slice(),
      requiresHw: {
        kind: 'nvidia-cuda',
        cudaMajor: 13,
        gpuNameMatch: BasaltCatalog.BLACKWELL_NAME_PATTERN,
        gpuNameNote: 'Basalt needs an NVIDIA RTX 50 series card (Blackwell, compute capability 12.0) as its main card; none was detected.',
      },
      requirementNote: build.requirementNote,
      options: JSON.parse(JSON.stringify(build.options)),
      protocol: 'openai-compat',
      launchStyle: 'basalt',
      hub: { ...BasaltCatalog.HUB },
      modelKinds: ['basalt'],
      repo: { ...build.repo },
      manualSourceUrl: BasaltCatalog.sourceUrl(build),
      release: { tag: build.release.tag },
    };
  }
}

module.exports = BasaltCatalog;
