class AgentLoopText {
  static SCREENSHOT_ATTACHED = 'Screenshot captured; the image is attached to this message: '
    + 'describe and decide from what you can actually SEE in it. It stays attached for this reply '
    + 'only; take a new screenshot if you need to look again later.';

  static SCREENSHOT_STALE = 'Screenshot captured earlier; its image is no longer attached '
    + '(a screenshot rides one reply only). Take a new screenshot if you need to look again.';

  static SCREENSHOT_HIDDEN = 'Screenshot captured, but its pixels are NOT visible to you; do not describe or draw '
    + 'conclusions from it. Read the page with get_source or get_element instead.';

  static SCREENSHOT_STRIPPED = 'Screenshot captured (pixels not visible to you; read the page with get_source/get_element instead)';

  static EMPTY_TURN_NUDGE = '[System: Your last reply was EMPTY: you produced internal '
    + 'reasoning but no visible message and no tool call, so the user saw nothing and nothing '
    + 'happened. Your thinking is not shown to anyone. Respond again NOW, and put your output '
    + 'in the reply itself: either emit the ```tool call for the action you were about to take, '
    + 'or write the answer in plain text.]';

  static STALL_NUDGE = '[System: Your reply announced an action but you did not call any tool; nothing has actually '
    + 'happened, and the user is still waiting. Do it NOW: emit the ```tool call for the action you described. Only '
    + 'reply without a tool call once you have the answer, or to report that you cannot get it.]';

  static DEFERRED_CALL = 'Not executed. Another call in this same response already changed state, '
    + 'and this one was written before you could see that result. Check what changed, then re-issue this call if you still need it.';

  static NO_BROWSER_TAB_INFO = '(none: this agent has no browser)';

  static LAZY_TAB_INFO = 'none yet: a blank working tab opens automatically the first time you use a browser action (navigate, click, screenshot, …)';

  static SPILL_READABLE_HINT = 'Use read_file or grep on that path to see any part of it.';

  static SPILL_REQUERY_HINT = 'Call the tool again with a narrower selector or query to get the part you need.';

  static SUMMARY_INSTRUCTION = 'Summarize the completed task in one concise sentence (max 120 chars). No quotes.';

  static SUMMARY_FALLBACK = 'Task completed';

  static carriedNotes(reasoningTail) {
    return '\n\n[Your reasoning before this call, internal context for continuity. NEVER repeat, quote, or mention '
      + `these notes in user-visible replies]:\n${reasoningTail}`;
  }

  static emptyReplyNotes(reasoningTail) {
    return '\n\n[Your reasoning from that empty reply, internal context for continuity. NEVER repeat, quote, or '
      + `mention these notes in user-visible replies]:\n${reasoningTail}`;
  }

  static lastSteps(remaining) {
    return `[System: You have ${remaining} step(s) remaining. STOP calling tools and write your FINAL answer now. `
      + 'Base it ONLY on information you actually obtained from the tool results above. If the pages were empty, '
      + 'blocked, or you could not get the requested information, SAY THAT PLAINLY and report what you tried; do '
      + 'NOT invent, assume, or claim to have summarized content you did not actually retrieve.]';
  }

  static verifyNudge(tool) {
    return `[System: Your last page action (${tool}) had NO visible effect: `
      + 'the URL, focus, text and dialogs were all unchanged afterwards, so it may not have worked. '
      + 'Before you give your final answer, confirm the outcome with page evidence: read the page '
      + '(get_source or observe_page) and cite the URL or confirmation text that proves it. '
      + 'If it did not work, try another way or tell the user plainly that it did not work.]';
  }

  static toolResult(tool, body) {
    return `[Tool Result for ${tool}]: ${body}`;
  }

  static notAllowed(tool, allowedTools) {
    return AgentLoopText.toolResult(tool, `Error: tool "${tool}" is not allowed for this run. Allowed tools: ${allowedTools.join(', ')}`);
  }

  static evicted(tool, chars) {
    return AgentLoopText.toolResult(tool, `(${chars} chars dropped to fit the context window. `
      + 'If you still need this, run it again; do not assume you remember it.)');
  }

  static overflowShrunk(dropped, tool) {
    return `\n[... ${dropped} chars of this ${tool} result were dropped because the request did not fit the context window. `
      + 'The start is above; re-run the tool with a narrower request if you need the rest.]';
  }

  static truncatedField(kept, length) {
    return `\n…[TRUNCATED: showing first ${kept} of ${length} chars. This output exceeded the `
      + 'context budget; do NOT guess at the missing part. Re-read what you need with a narrower '
      + 'tool: get_element / extract_data for specific data, or get_source with type "markdown".]';
  }

  static spillHeader(sizeLabel, displayPath) {
    return `[Result too large for context (~${sizeLabel} tokens). Full result saved to ${displayPath}. Shape of the data:]`;
  }

  static screenshotSize(width, height) {
    return `Image is ${width}x${height} px; click_at takes x/y in these pixels.`;
  }

  static timedOut(timeoutMs, iterationsDone, maxIterations, toolCalls) {
    const minutes = Math.round(timeoutMs / 60000 * 10) / 10;
    return `Execution timed out after ${minutes} minutes `
      + `(${iterationsDone} of ${maxIterations} iterations): ${AgentLoopText._completedCalls(toolCalls)}. `
      + 'Send "continue" to pick up from here.';
  }

  static summaryRequest(toolCalls, finalResponse) {
    return `Tools used: ${toolCalls.map((call) => call.tool).join(', ')}\n\nFinal response:\n${finalResponse.slice(0, 500)}`;
  }

  static _completedCalls(toolCalls) {
    const names = toolCalls.map((call) => call.tool);
    if (!names.length) return 'no tool call completed';
    const shown = names.slice(-8);
    return `${names.length} tool call${names.length === 1 ? '' : 's'} completed`
      + ` (${shown.length < names.length ? '…, ' : ''}${shown.join(', ')})`
      + '; their effects are already applied';
  }
}

module.exports = AgentLoopText;
