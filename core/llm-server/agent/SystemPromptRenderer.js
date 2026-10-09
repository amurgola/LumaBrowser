const SystemPromptText = require('./SystemPromptText');

class SystemPromptRenderer {
  static render(ctx, now = new Date()) {
    const view = SystemPromptRenderer._view(ctx);
    const blocks = [
      SystemPromptRenderer._block('system_role', view.noBrowser ? SystemPromptText.ROLE_NO_BROWSER : SystemPromptText.ROLE_BROWSER),
      SystemPromptRenderer._block('current_date', SystemPromptText.currentDate(now)),
      SystemPromptRenderer._block('key_constraints', SystemPromptRenderer._keyConstraints(view)),
    ];
    if (!view.noBrowser) blocks.push(SystemPromptRenderer._block('dynamic_state', SystemPromptText.activeTab(view.tabInfo)));
    blocks.push(SystemPromptRenderer._block('formatting_constraints', SystemPromptRenderer._formatting(view.parallel)));
    if (view.tools.length) blocks.push(SystemPromptRenderer._block('tool_definitions', view.tools.join('\n')));
    if (view.append) blocks.push(SystemPromptRenderer._block('additional_instructions', view.append));
    if (!view.omitExecRules) blocks.push(SystemPromptRenderer._block('execution_rules', SystemPromptRenderer._executionRules(view)));
    return blocks.join('\n\n');
  }

  static _view(ctx) {
    const noBrowser = !!ctx.noBrowser;
    return {
      noBrowser,
      tabInfo: ctx.tabInfo,
      tools: noBrowser ? [] : (Array.isArray(ctx.tools) ? ctx.tools : []),
      append: (ctx.append || '').trim(),
      parallel: !!ctx.parallelToolCalls,
      omitExecRules: !!ctx.omitExecRules,
    };
  }

  static _keyConstraints(view) {
    const rules = [
      view.parallel ? SystemPromptText.ONE_CALL_PARALLEL : SystemPromptText.ONE_CALL_STRICT,
      SystemPromptText.FINISH_WITH_MESSAGE,
    ];
    const lead = view.omitExecRules ? SystemPromptText.KEY_CONSTRAINTS_LEAD_NO_TAIL : SystemPromptText.KEY_CONSTRAINTS_LEAD;
    return lead + rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n');
  }

  static _formatting(parallel) {
    return SystemPromptText.formatLead(parallel)
      + SystemPromptText.FORMAT_EXAMPLE
      + (parallel ? SystemPromptText.FORMAT_PARALLEL_COUNT : SystemPromptText.FORMAT_STRICT_COUNT)
      + SystemPromptText.FORMAT_FINISH;
  }

  static _executionRules(view) {
    const rules = [
      view.parallel ? SystemPromptText.EXEC_ONE_CALL_PARALLEL : SystemPromptText.EXEC_ONE_CALL_STRICT,
      SystemPromptText.EXEC_DECIDE,
      SystemPromptText.EXEC_FINISH,
      SystemPromptText.EXEC_ON_FAILURE,
      SystemPromptText.EXEC_IMAGES,
    ];
    if (!view.noBrowser) rules.push(SystemPromptText.EXEC_BY_REF, SystemPromptText.EXEC_URL_CHANGE);
    return rules.map((rule) => `- ${rule}`).join('\n');
  }

  static _block(tag, body) {
    return `<${tag}>\n${SystemPromptRenderer._indent(body)}\n</${tag}>`;
  }

  static _indent(text) {
    return String(text)
      .split('\n')
      .map((line) => (line ? `  ${line}` : line))
      .join('\n');
  }
}

module.exports = SystemPromptRenderer;
