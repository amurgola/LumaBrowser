class LoopFeedback {
  static WRAP_UP = 'Several loop warnings have piled up in this turn. Stop calling tools and write your reply to the '
    + 'user now from the results you hold. Where something stayed out of reach, name that part for the user.';

  static OBSERVED = {
    'identical-streak': (f) => `Skipped: ${f.tool} was requested ${f.facts.times} times in a row with the same `
      + 'arguments and nothing else ran in between, so its answer is unchanged.',
    'echoed-lookup': (f) => (f.facts.reworded
      ? `Skipped: this ${f.tool} query is a rewording of "${f.facts.earlierQuery}" (step ${f.facts.earlierStep}) `
        + 'and would bring back the same results.'
      : `Skipped: this ${f.tool} request is the same as step ${f.facts.earlierStep}, which succeeded; its result is `
        + 'earlier in this conversation.'),
    'search-allowance': (f) => `Skipped: all ${f.facts.allowance} searches allowed in one turn are spent. `
      + 'Opening a specific URL with web_search still works.',
    'inert-action': (f) => `Heads-up: this ${f.tool} has now run ${f.facts.times} times on the same target with the `
      + 'page left unchanged each time.',
    'stale-search': (f) => `Heads-up: the last ${f.facts.searches} searches turned up almost nothing that earlier `
      + 'results had not already shown.',
  };

  static REDIRECT = {
    'identical-streak': 'Call a different tool, change the arguments, or act on what the last result showed.',
    'echoed-lookup': 'Work from that earlier result, or search for an aspect it did not cover.',
    'search-allowance': 'Open the most promising result URL, or write your reply from the results you hold.',
    'inert-action': 'Call observe_page for fresh element refs and pick a different element, or describe the control '
      + 'to locate.',
    'stale-search': 'If the results answer the question, write your reply; otherwise open a result URL to read it '
      + 'in full.',
  };

  static compose(finding, level) {
    return `${LoopFeedback._observed(finding)} ${LoopFeedback._instruction(finding, level)}`;
  }

  static _observed(finding) {
    const write = LoopFeedback.OBSERVED[finding.pattern];
    return write ? write(finding) : `Loop check (${finding.pattern}) on ${finding.tool}.`;
  }

  static _instruction(finding, level) {
    if (level === 'conclude') return LoopFeedback.WRAP_UP;
    const redirect = LoopFeedback.REDIRECT[finding.pattern] || 'Choose a different next step.';
    return level === 'insist' ? `This is a repeated loop warning; your next step must change course. ${redirect}` : redirect;
  }
}

module.exports = LoopFeedback;
