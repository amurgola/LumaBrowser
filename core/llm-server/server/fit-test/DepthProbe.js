const FitGenerationClient = require('./FitGenerationClient');

class DepthProbe {
  static TARGET_TOKENS = 16384;
  static MIN_CTX = 20480;
  static OUTPUT_RESERVE = 1024;
  static GEN_MAX_TOKENS = 128;
  static TIMEOUT_MS = 600 * 1000;
  static CHARS_PER_TOKEN = 3.4;
  static TRIM_MARGIN = 0.97;
  static SYSTEM_PROMPT = 'You are a terse archivist.';
  static QUESTION = 'In one short sentence, say how many entries appear above.';

  static CLAUSES = [
    'the archive shelved a weather log from the northern station',
    'a survey team measured the gradient along the eastern ridge',
    'the ledger recorded a shipment of copper fittings for the mill',
    'the orchard crew pruned the older rows before the first frost',
    'a maintenance note flagged the pump on the lower terrace',
    'the harbour office logged a late ferry under heavy fog',
    'the library catalogued a bound set of regional field guides',
    'the kitchen inventory listed twelve crates of winter squash',
    'the workshop replaced the belt on the second lathe',
    'a cartographer corrected the river bend on the valley sheet',
    'the greenhouse report tracked humidity across the night shift',
    'the depot counted spare rails for the branch line repair',
    'the observatory noted a clear sky over the western horizon',
    'the bakery schedule moved the rye batch to the early oven',
    'the clinic restocked bandages after the harvest season',
    'the mill foreman adjusted the sluice gate at midday',
  ];

  constructor({ client = new FitGenerationClient() } = {}) {
    this._client = client;
  }

  async measure(port, contextTokens, cancelled, apiKey) {
    const budget = DepthProbe.budgetTokens(contextTokens);
    if (budget <= 0) return null;
    const filler = await this._fitFillerToBudget(port, budget, apiKey);
    const gen = await this._client.generateAndTime(port, cancelled, apiKey, {
      messages: DepthProbe._messages(filler),
      maxTokens: DepthProbe.GEN_MAX_TOKENS,
      timeoutMs: DepthProbe.TIMEOUT_MS,
    });
    return {
      promptTokens: gen.promptTokens,
      prefillMs: gen.promptMs,
      promptTokensPerSec: gen.promptTokensPerSec,
      tokensPerSec: gen.tokensPerSec,
      completionTokens: gen.completionTokens,
    };
  }

  static budgetTokens(contextTokens) {
    const ctx = Math.floor(Number(contextTokens)) || 0;
    if (ctx < DepthProbe.MIN_CTX) return 0;
    return Math.max(0, Math.min(DepthProbe.TARGET_TOKENS, ctx - DepthProbe.OUTPUT_RESERVE));
  }

  static buildPrompt(targetTokens) {
    const targetChars = Math.max(0, Math.floor(targetTokens * DepthProbe.CHARS_PER_TOKEN));
    const lines = [];
    let chars = 0;
    for (let i = 1; chars < targetChars; i++) {
      const line = DepthProbe._line(i);
      lines.push(line);
      chars += line.length + 1;
    }
    return lines.join('\n');
  }

  static _line(i) {
    const clause = DepthProbe.CLAUSES[(i * 7) % DepthProbe.CLAUSES.length];
    return `Entry ${i}: ${clause}, filed on day ${(i * 13) % 365 + 1} of the year ${1900 + (i % 120)}.`;
  }

  async _fitFillerToBudget(port, budget, apiKey) {
    const filler = DepthProbe.buildPrompt(budget);
    const count = await this._client.countTokens(port, filler, apiKey);
    if (count == null || count <= budget) return filler;
    return filler.slice(0, Math.floor(filler.length * (budget / count) * DepthProbe.TRIM_MARGIN));
  }

  static _messages(filler) {
    return [
      { role: 'system', content: DepthProbe.SYSTEM_PROMPT },
      { role: 'user', content: `${filler}\n\n${DepthProbe.QUESTION}` },
    ];
  }
}

module.exports = DepthProbe;
