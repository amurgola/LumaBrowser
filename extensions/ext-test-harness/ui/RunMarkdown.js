import HarnessText from './HarnessText.js';

export default class RunMarkdown {
  static PARAM_PREVIEW_MAX = 80;

  static format(run, detail) {
    const parts = HarnessText.detailParts(run, detail);
    return [
      ...RunMarkdown._header(run, parts),
      ...RunMarkdown._assertions(parts.assertions),
      ...RunMarkdown._toolCalls(parts.toolCalls),
      ...RunMarkdown._notes(parts.notes),
      ...RunMarkdown._conversation(parts.conversation),
      ...RunMarkdown._section('Final Response', parts.fullLog.finalResponse),
      ...RunMarkdown._section('Error', parts.fullLog.error),
    ].join('\n');
  }

  static _header(run, parts) {
    const tick = String.fromCharCode(96);
    return [
      `# Test Run: ${run.test_id}${run.variant_id ? ' / ' + run.variant_id : ''}`,
      '',
      '| Field | Value |',
      '|-------|-------|',
      `| Run ID | ${tick}${run.id}${tick} |`,
      `| Status | **${run.status}** |`,
      `| Started | ${run.started_at} |`,
      `| Completed | ${run.completed_at || 'N/A'} |`,
      `| Duration | ${HarnessText.formatDuration(run.duration_ms)} |`,
      `| Total iterations | ${parts.fullLog.iterations || 'N/A'} |`,
      `| Total tool calls | ${parts.toolCalls.length} |`,
      '',
    ];
  }

  static _assertions(assertions) {
    if (!assertions.length) return [];
    const lines = ['## Assertions', ''];
    for (const a of assertions) {
      lines.push(`- **${a.passed ? 'PASS' : 'FAIL'}**: ${a.name}`);
      if (a.detail) lines.push(`  ${String(a.detail).substring(0, 200)}`);
    }
    lines.push('');
    return lines;
  }

  static _toolCalls(toolCalls) {
    if (!toolCalls.length) return [];
    const lines = ['## Tool Calls', '', '| # | Tool | Params | Duration | Result |', '|---|------|--------|----------|--------|'];
    for (const tc of toolCalls) lines.push(RunMarkdown._toolRow(tc));
    lines.push('', `**Tools used**: ${toolCalls.map((tc) => tc.tool).join(', ')}`, '');
    return lines;
  }

  static _toolRow(tc) {
    const tick = String.fromCharCode(96);
    const params = JSON.stringify(tc.params || {});
    const max = RunMarkdown.PARAM_PREVIEW_MAX;
    const preview = params.length > max ? params.substring(0, max - 3) + '...' : params;
    const status = tc.result?.success !== false ? 'ok' : '**err**';
    return `| ${tc.iteration} | ${tick}${tc.tool}${tick} | ${tick}${preview}${tick} | ${HarnessText.formatDuration(tc.durationMs)} | ${status} |`;
  }

  static _notes(notes) {
    if (!notes.length) return [];
    const lines = ['## Notes (Manual Review)', ''];
    for (const n of notes) {
      lines.push(`- ${n.message}`);
      if (n.data) lines.push(...RunMarkdown._fence(typeof n.data === 'string' ? n.data : JSON.stringify(n.data, null, 2)));
    }
    lines.push('');
    return lines;
  }

  static _conversation(messages) {
    if (!messages.length) return [];
    const lines = ['## Conversation Log', ''];
    for (const msg of messages) {
      lines.push(`### ${HarnessText.roleLabel(msg.role)}`, '', ...RunMarkdown._fence(msg.content || ''), '');
    }
    return lines;
  }

  static _section(title, body) {
    if (!body) return [];
    return [`## ${title}`, '', body, ''];
  }

  static _fence(text) {
    const fence = String.fromCharCode(96).repeat(3);
    return [fence, text, fence];
  }
}
