class GroundingReplyParser {
  static NUMBER_PATTERN = '(-?\\d+(?:\\.\\d+)?)';

  static POINT_KEYS = ['coordinate', 'coordinates', 'point_2d', 'point', 'click', 'position', 'bbox_2d', 'bbox', 'box'];

  static JSON_ENVELOPES = [
    { pattern: /```(?:json)?\s*([\s\S]*?)```/i, group: 1 },
    { pattern: /<answer>([\s\S]*?)<\/answer>/i, group: 1 },
    { pattern: /<tool_call>([\s\S]*?)<\/tool_call>/i, group: 1 },
    { pattern: /\{[\s\S]*\}/, group: 0 },
    { pattern: /\[[\s\S]*\]/, group: 0 },
  ];

  static TEXT_PATTERNS = GroundingReplyParser._buildTextPatterns();

  static parse(reply) {
    const text = GroundingReplyParser.stripReasoning(reply);
    if (!text) return null;
    return GroundingReplyParser._fromJsonCandidates(text) || GroundingReplyParser._fromText(text);
  }

  static stripReasoning(text) {
    return String(text || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, ' ')
      .replace(/<grounding_think>[\s\S]*?<\/grounding_think>/gi, ' ')
      .replace(/<think>[\s\S]*$/i, ' ')
      .trim();
  }

  static _fromJsonCandidates(text) {
    for (const candidate of GroundingReplyParser._jsonCandidates(text)) {
      const hit = GroundingReplyParser._fromJson(GroundingReplyParser._tryParseJson(candidate));
      if (hit) return hit;
    }
    return null;
  }

  static _jsonCandidates(text) {
    const candidates = [];
    for (const { pattern, group } of GroundingReplyParser.JSON_ENVELOPES) {
      const match = text.match(pattern);
      if (match) candidates.push(match[group].trim());
    }
    return candidates;
  }

  static _tryParseJson(candidate) {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  static _fromJson(value) {
    if (Array.isArray(value)) return GroundingReplyParser._fromJsonArray(value);
    if (!value || typeof value !== 'object') return null;
    return GroundingReplyParser._fromXY(value)
      || GroundingReplyParser._fromPointKeys(value)
      || GroundingReplyParser._fromNestedObject(value);
  }

  static _fromJsonArray(values) {
    const isListOfObjects = values.length && typeof values[0] === 'object' && !Array.isArray(values[0]);
    if (isListOfObjects) return GroundingReplyParser._fromJson(values[0]);
    return GroundingReplyParser._fromArray(values);
  }

  static _fromXY(value) {
    const hasXY = GroundingReplyParser._isNumber(Number(value.x)) && GroundingReplyParser._isNumber(Number(value.y))
      && value.x !== '' && value.y !== '';
    return hasXY ? GroundingReplyParser._point(Number(value.x), Number(value.y)) : null;
  }

  static _fromPointKeys(value) {
    for (const key of GroundingReplyParser.POINT_KEYS) {
      if (value[key] == null) continue;
      const hit = GroundingReplyParser._fromPointValue(value[key]);
      if (hit) return hit;
    }
    return null;
  }

  static _fromPointValue(entry) {
    const hit = Array.isArray(entry) ? GroundingReplyParser._fromArray(entry) : GroundingReplyParser._fromJson(entry);
    if (hit) return hit;
    return typeof entry === 'string' ? GroundingReplyParser._fromText(entry) : null;
  }

  static _fromNestedObject(value) {
    for (const nested of Object.values(value)) {
      if (!nested || typeof nested !== 'object') continue;
      const hit = GroundingReplyParser._fromJson(nested);
      if (hit) return hit;
    }
    return null;
  }

  static _fromArray(values) {
    if (!Array.isArray(values)) return null;
    if (values.length === 1 && Array.isArray(values[0])) return GroundingReplyParser._fromArray(values[0]);
    if (values.length === 2 && Array.isArray(values[0]) && Array.isArray(values[1])) {
      return GroundingReplyParser._fromCornerPair(values);
    }
    return GroundingReplyParser._fromNumbers(values.map(Number));
  }

  static _fromCornerPair([[x1, y1], [x2, y2]]) {
    const corners = [x1, y1, x2, y2];
    return corners.every(GroundingReplyParser._isNumber) ? GroundingReplyParser._box(corners) : null;
  }

  static _fromNumbers(numbers) {
    if (!numbers.every(GroundingReplyParser._isNumber)) return null;
    if (numbers.length === 2) return GroundingReplyParser._point(numbers[0], numbers[1]);
    if (numbers.length === 4) return GroundingReplyParser._box(numbers);
    return null;
  }

  static _fromText(text) {
    for (const pattern of GroundingReplyParser.TEXT_PATTERNS) {
      const match = text.match(pattern);
      if (!match) continue;
      const numbers = match.slice(1).filter((group) => group !== undefined).map(Number);
      const hit = GroundingReplyParser._fromNumbers(numbers);
      if (hit) return hit;
    }
    return null;
  }

  static _buildTextPatterns() {
    const n = GroundingReplyParser.NUMBER_PATTERN;
    return [
      new RegExp(`\\bx\\s*[=:]\\s*${n}\\s*,\\s*y\\s*[=:]\\s*${n}`, 'i'),
      new RegExp(`\\(\\s*${n}\\s*,\\s*${n}\\s*\\)\\s*,\\s*\\(\\s*${n}\\s*,\\s*${n}\\s*\\)`),
      new RegExp(`\\(\\s*${n}\\s*,\\s*${n}\\s*\\)`),
      new RegExp(`\\[\\s*${n}\\s*,\\s*${n}\\s*,\\s*${n}\\s*,\\s*${n}\\s*\\]`),
      new RegExp(`\\[\\s*${n}\\s*,\\s*${n}\\s*\\]`),
      new RegExp(`<point>\\s*${n}[\\s,]+${n}\\s*</point>`, 'i'),
    ];
  }

  static _point(x, y) {
    if (x < 0 && y < 0) return { infeasible: true };
    return { point: { x, y } };
  }

  static _box([x1, y1, x2, y2]) {
    if (x1 < 0 && y1 < 0) return { infeasible: true };
    return { point: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, bbox: [x1, y1, x2, y2] };
  }

  static _isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }
}

module.exports = GroundingReplyParser;
