export default class StatusText {
  static PHASES = {
    'switching-model': 'Loading the selected model...',
    'starting-server': 'Starting the local model...',
    'loading-vision': 'Loading vision (image support)...',
    'unloading-vision': 'Switching back to fast text mode...',
    compacting: 'Summarizing earlier conversation to free context...',
    'waiting-for-slot': 'Waiting for processing...',
  };

  static forPhase(phase) {
    return StatusText.PHASES[phase] || 'Working...';
  }

  static COMPACTED = 'Earlier conversation summarized to fit the context window';

  static compactedTitle(removed) {
    return (removed ? removed + ' older message(s) were condensed into one summary. ' : '')
      + 'The full history is still saved; only what the model sees was condensed.';
  }
}
