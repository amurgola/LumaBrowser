import RunDuration from './RunDuration.js';

export default class RunLogMarkdown {
  static format(data) {
    const { run, task, log } = data;
    const lines = [];
    RunLogMarkdown._header(lines, run, task, log);
    if (!log) lines.push('## Conversation Log', '', '*No detailed log available for this run.*', '');
    else RunLogMarkdown._log(lines, log);
    lines.push('## Request Prompt', '', '```', run.request_prompt || '(none)', '```', '');
    lines.push('## Final Response', '', run.response || '(empty)', '');
    return lines.join('\n');
  }

  static _header(lines, run, task, log) {
    lines.push(`# Task Run: ${task?.name || run.task_id}`, '');
    lines.push('| Field | Value |', '|-------|-------|');
    lines.push(`| Run ID | \`${run.id}\` |`);
    lines.push(`| Task ID | \`${run.task_id}\` |`);
    lines.push(`| Status | **${run.status}** |`);
    lines.push(`| Started | ${run.started_at} |`);
    lines.push(`| Completed | ${run.completed_at || 'N/A'} |`);
    if (run.completed_at && run.started_at) lines.push(`| Duration | ${RunDuration.between(run.started_at, run.completed_at)} |`);
    if (log?.tabId != null) lines.push(`| Tab ID | ${log.tabId} |`);
    if (log?.iterations != null) lines.push(`| Iterations | ${log.iterations} |`);
    lines.push('');
  }

  static _log(lines, log) {
    if (log.systemPrompt) lines.push('## System Prompt', '', '```', log.systemPrompt, '```', '');
    if (log.systemPromptAppend) lines.push('## Response Schema Instruction (appended)', '', '```', log.systemPromptAppend, '```', '');
    if (log.error) lines.push('## Run Error', '', '```', log.error, '```', '');
    if (log.toolCalls && log.toolCalls.length > 0) RunLogMarkdown._toolCalls(lines, log.toolCalls);
    if (log.steps && log.steps.length > 0) RunLogMarkdown._steps(lines, log.steps);
  }

  static _toolCalls(lines, toolCalls) {
    lines.push('## Tool Calls Summary', '', '| # | Tool | Params | Result | Duration |', '|---|------|--------|--------|----------|');
    toolCalls.forEach((tc, i) => {
      const paramStr = JSON.stringify(tc.params || {});
      const paramPreview = paramStr.length > 80 ? paramStr.substring(0, 77) + '...' : paramStr;
      const outcome = tc.success === false ? `**err**: ${(tc.error || '').toString().slice(0, 60)}` : 'ok';
      const dur = tc.durationMs != null ? `${tc.durationMs}ms` : 'n/a';
      lines.push(`| ${i} | \`${tc.tool}\` | \`${paramPreview}\` | ${outcome} | ${dur} |`);
    });
    lines.push('');
  }

  static _steps(lines, steps) {
    lines.push('## Conversation Log', '');
    for (const step of steps) {
      lines.push(`### Iteration ${step.iteration}`, '');
      if (step.llmError) { lines.push(`**LLM Error**: ${step.llmError}`, ''); continue; }
      RunLogMarkdown._assistantText(lines, step.assistantContent || '');
      if (step.toolCall) RunLogMarkdown._toolStep(lines, step);
    }
  }

  static _assistantText(lines, content) {
    const text = content.replace(/```tool[\s\S]*?```/g, '').trim();
    if (text) lines.push('**Assistant**:', '', '> ' + text.split('\n').join('\n> '), '');
  }

  static _toolStep(lines, step) {
    lines.push(`**Tool Call**: \`${step.toolCall.tool}\``, '', '```json', JSON.stringify(step.toolCall.params, null, 2), '```', '');
    lines.push(`**Tool Result**: ${step.toolSuccess ? 'ok' : '**ERROR**'} (${step.toolDurationMs}ms)`, '', '```json', JSON.stringify(step.toolResult, null, 2), '```', '');
  }
}
