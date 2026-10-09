class GroundingProfiles {
  static QWEN3_MIN_PIXELS = 1024 * 32 * 32;

  static DEFAULT_MAX_PIXELS = 2_100_000;

  static GREEDY_NO_THINK = { temperature: 0, chat_template_kwargs: { enable_thinking: false } };

  static MATCH_ORDER = ['holo', 'mai-ui', 'ui-venus', 'qwen25', 'qwen3'];

  static PROFILES = {
    holo: {
      id: 'holo',
      label: 'Holo2 / Holo3 / Holo3.1 / Holo4 (H Company)',
      match: /holo[-_ ]?[234]/i,
      coordFormat: 'norm1000',
      factor: 32,
      minPixels: GroundingProfiles.QWEN3_MIN_PIXELS,
      maxPixels: GroundingProfiles.DEFAULT_MAX_PIXELS,
      request: { ...GroundingProfiles.GREEDY_NO_THINK, max_tokens: 64 },
      buildMessages: (args) => GroundingProfiles._holoMessages(args),
    },

    'mai-ui': {
      id: 'mai-ui',
      label: 'MAI-UI (Tongyi)',
      match: /mai[-_ ]?ui/i,
      coordFormat: 'norm999',
      factor: 32,
      minPixels: GroundingProfiles.QWEN3_MIN_PIXELS,
      maxPixels: GroundingProfiles.DEFAULT_MAX_PIXELS,
      request: { temperature: 0, max_tokens: 768 },
      buildMessages: (args) => GroundingProfiles._maiUiMessages(args),
    },

    'ui-venus': {
      id: 'ui-venus',
      label: 'UI-Venus-2 (inclusionAI)',
      match: /ui[-_ ]?venus/i,
      coordFormat: 'norm1000',
      factor: 32,
      minPixels: GroundingProfiles.QWEN3_MIN_PIXELS,
      maxPixels: GroundingProfiles.DEFAULT_MAX_PIXELS,
      request: { ...GroundingProfiles.GREEDY_NO_THINK, max_tokens: 64 },
      buildMessages: (args) => GroundingProfiles._uiVenusMessages(args),
    },

    qwen3: {
      id: 'qwen3',
      label: 'Qwen3-VL / Qwen3.5+ (native grounding)',
      match: /qwen[-_ ]?3/i,
      coordFormat: 'norm1000',
      factor: 32,
      minPixels: GroundingProfiles.QWEN3_MIN_PIXELS,
      maxPixels: GroundingProfiles.DEFAULT_MAX_PIXELS,
      request: { ...GroundingProfiles.GREEDY_NO_THINK, max_tokens: 128 },
      buildMessages: (args) => GroundingProfiles._qwen3Messages(args),
    },

    qwen25: {
      id: 'qwen25',
      label: 'Qwen2.5-VL family (UI-TARS-1.5, Holo1.5, ...)',
      match: /qwen[-_ ]?2\.5|ui[-_ ]?tars|holo[-_ ]?1/i,
      coordFormat: 'pixels',
      factor: 28,
      minPixels: 1024 * 28 * 28,
      maxPixels: GroundingProfiles.DEFAULT_MAX_PIXELS,
      request: { temperature: 0, max_tokens: 128 },
      buildMessages: (args) => GroundingProfiles._qwen25Messages(args),
    },

    pixels: {
      id: 'pixels',
      label: 'Generic vision model (pixel coordinates)',
      match: null,
      coordFormat: 'pixels',
      factor: null,
      maxLongEdge: 1568,
      request: { temperature: 0, max_tokens: 256 },
      buildMessages: (args) => GroundingProfiles._pixelsMessages(args),
    },
  };

  static getProfile(idOrModel) {
    if (!idOrModel) return GroundingProfiles.PROFILES.pixels;
    if (GroundingProfiles.PROFILES[idOrModel]) return GroundingProfiles.PROFILES[idOrModel];
    return GroundingProfiles.profileForModel(idOrModel);
  }

  static profileForModel(name) {
    const modelName = String(name || '');
    const id = GroundingProfiles.MATCH_ORDER.find((candidate) => GroundingProfiles._matches(candidate, modelName));
    return id ? GroundingProfiles.PROFILES[id] : GroundingProfiles.PROFILES.pixels;
  }

  static _matches(id, modelName) {
    const pattern = GroundingProfiles.PROFILES[id].match;
    return !!pattern && pattern.test(modelName);
  }

  static _holoMessages({ instruction, dataUrl }) {
    const schema = {
      type: 'object',
      properties: {
        x: { type: 'integer', minimum: 0, maximum: 1000, description: 'X coordinate as integer in [0, 1000]' },
        y: { type: 'integer', minimum: 0, maximum: 1000, description: 'Y coordinate as integer in [0, 1000]' },
      },
      required: ['x', 'y'],
    };
    const text = 'Localize an element on the GUI image according to the provided target '
      + 'and output a click position.\n'
      + ` * You must output a valid JSON following the format: ${JSON.stringify(schema)}\n`
      + ` Your target is:\n${instruction}`;
    return GroundingProfiles._imageThenText(dataUrl, text);
  }

  static _maiUiMessages({ instruction, dataUrl }) {
    const system = [
      'You are a GUI grounding agent. ',
      '## Task',
      "Given a screenshot and the user's grounding instruction. Your task is to accurately locate a UI element based on the user's instructions.",
      "First, you should carefully examine the screenshot and analyze the user's instructions,  translate the user's instruction into a effective reasoning process, and then provide the final coordinate.",
      '## Output Format',
      'Return a json object with a reasoning process in <grounding_think></grounding_think> tags, a [x,y] format coordinate within <answer></answer> XML tags:',
      '<grounding_think>...</grounding_think>',
      '<answer>',
      '{"coordinate": [x,y]}',
      '</answer>',
    ].join('\n');
    return [
      { role: 'system', content: system },
      { role: 'user', content: [{ type: 'text', text: instruction }, GroundingProfiles._imagePart(dataUrl)] },
    ];
  }

  static _uiVenusMessages({ instruction, dataUrl }) {
    const text = 'Output the center point of the position corresponding to the following instruction: \n'
      + `${instruction}. \n\n`
      + 'The output should just be the coordinates of a point, in the format [x,y]. '
      + 'Additionally, if the task is infeasible (e.g., the task is not related to the image), '
      + 'the output should be [-1,-1].';
    return GroundingProfiles._imageThenText(dataUrl, text);
  }

  static _qwen3Messages({ instruction, dataUrl }) {
    const text = `Locate the UI element described below in the screenshot, output its bbox coordinates using JSON format.\n${instruction}`;
    return GroundingProfiles._imageThenText(dataUrl, text);
  }

  static _qwen25Messages({ instruction, dataUrl, sent }) {
    const text = `The screenshot is ${sent.width}x${sent.height} pixels. `
      + `Locate the UI element described below and output its bbox coordinates in pixels using JSON format.\n${instruction}`;
    return GroundingProfiles._imageThenText(dataUrl, text);
  }

  static _pixelsMessages({ instruction, dataUrl, sent }) {
    const text = `This screenshot is exactly ${sent.width}x${sent.height} pixels. `
      + 'Find the UI element described below and reply with ONLY a JSON object {"x": <int>, "y": <int>} '
      + 'giving the pixel coordinates of its centre, origin at the top-left. '
      + `If it is not visible, reply {"x": -1, "y": -1}.\nElement: ${instruction}`;
    return GroundingProfiles._imageThenText(dataUrl, text);
  }

  static _imageThenText(dataUrl, text) {
    return [{ role: 'user', content: [GroundingProfiles._imagePart(dataUrl), { type: 'text', text }] }];
  }

  static _imagePart(dataUrl) {
    return { type: 'image_url', image_url: { url: dataUrl } };
  }
}

module.exports = GroundingProfiles;
