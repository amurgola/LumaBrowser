class SummaryDirective {
  static MARKER = '[Summary of the earlier conversation]';

  static TEXT = [
    'Summarize the conversation so far so that it can continue with the older messages removed.',
    'Write the summary under these exact section headings, in this order, and include every heading',
    'even when it is empty (write "(none)" under it):',
    '',
    '1. Primary Request and Intent: what the user actually asked for, in their terms.',
    '2. Key Technical Concepts: technologies, patterns and constraints that matter here.',
    '3. Files and Code: concrete paths touched or read, and what is in them that matters.',
    '4. Errors and Fixes: failures hit and how they were resolved, or that they were not.',
    '5. Pending Jobs: work explicitly requested and not yet done.',
    '6. Current Work: what was happening immediately before this summary.',
    '7. Next Step: the single next action, only if it clearly follows from the above.',
    '8. Critical Context: anything else that would be expensive to rediscover.',
    '',
    'If the conversation above already contains a summary block, treat it as a checkpoint to',
    'consolidate, not as text to copy forward verbatim: keep the facts that are still true, drop the',
    'ones that later messages made stale, and merge everything newer under the same eight headings.',
    '',
    'Be specific and terse. Output only the summary. Do not continue the conversation, do not add',
    'commentary, and do not answer the last message.',
  ].join('\n');

  static wrap(summaryText) {
    return `${SummaryDirective.MARKER} Older messages were condensed to save context.\n\n${String(summaryText).trim()}`;
  }
}

module.exports = SummaryDirective;
