const BackgroundTask = require('./BackgroundTask');

class BackgroundTaskText {
  static NOTE = [
    'Background tasks: a tool call that will take minutes or longer (a long command in the terminal, several image',
    'or video renders) can run in the background so the user is not left waiting on it. Call run_in_background with',
    'tool: the name of the tool, arguments: exactly what you would pass that tool, and title: a few words the user',
    'will see. It answers at once with a task id. To queue several, call it once for each. Then tell the user what',
    'you started and end your reply. When every task you started in a reply has finished, the app sends you their',
    'results in a message marked as automated, and you answer the user from them then. Do not wait, sleep or check',
    'in a loop for a task, and never state a result you have not been given. background_task_status is for when',
    'the user asks how a task is going; stop_background_task stops one. Run a call directly, not in the background,',
    'when it is quick or when you need its result to go on with this reply.',
  ].join(' ');

  static AUTOMATED_HEAD = '[Automated message from LumaBrowser, not written by the user. Background tasks you started have ended. '
    + 'The user has not seen these results.]';

  static AUTOMATED_FOOT = 'Tell the user the outcome now, in your own words, from what is written above only. '
    + 'If a task failed or was stopped, say so plainly.';

  static STATE_WORDS = {
    [BackgroundTask.QUEUED]: 'queued',
    [BackgroundTask.RUNNING]: 'running',
    [BackgroundTask.DONE]: 'finished',
    [BackgroundTask.FAILED]: 'failed',
    [BackgroundTask.CANCELED]: 'stopped',
  };

  static started(task, queuedAhead = 0) {
    const place = queuedAhead > 0
      ? `is queued behind ${queuedAhead} other${queuedAhead === 1 ? '' : 's'} and starts when they are done`
      : (task.state === BackgroundTask.QUEUED ? 'is queued and starts when this reply has ended' : 'is running in the background');
    return `Task ${task.id} "${task.title}" ${place}. Its result is sent to you automatically when it and the other tasks `
      + 'from this reply have ended. Tell the user it has started and end your reply: do not wait for it or check on it.';
  }

  static line(task, progress = null) {
    const facts = [BackgroundTaskText._stateWithTime(task)];
    if (progress) facts.push(progress);
    return `${task.id} "${task.title}" (${task.tool}): ${facts.filter(Boolean).join(', ')}`;
  }

  static notice(tasks, stillRunning = []) {
    const sections = tasks.map((task) => BackgroundTaskText.outcome(task));
    const running = stillRunning.length
      ? `Still going, and reported to you later: ${stillRunning.map((task) => BackgroundTaskText.line(task)).join('; ')}.`
      : null;
    return [BackgroundTaskText.AUTOMATED_HEAD, ...sections, running, BackgroundTaskText.AUTOMATED_FOOT].filter(Boolean).join('\n\n');
  }

  static outcome(task) {
    const head = `Task ${BackgroundTaskText.line(task)}.`;
    if (task.state === BackgroundTask.CANCELED) return task.result ? `${head}\nOutput before it stopped:\n${task.result}` : head;
    const label = task.state === BackgroundTask.FAILED ? 'Error' : 'Result';
    const made = task.artifacts && task.artifacts.length
      ? `\nIt made: ${task.artifacts.map((artifact) => `${artifact.title || artifact.type} (artifact ${artifact.id})`).join(', ')}. The user can see ${task.artifacts.length === 1 ? 'it' : 'them'} in the conversation.`
      : '';
    return `${head}\n${label}:\n${task.result || '(nothing was returned)'}${made}`;
  }

  static tail(tasks, progressOf = () => '') {
    const going = tasks.filter((task) => !BackgroundTaskText._ended(task));
    const waiting = tasks.filter((task) => BackgroundTaskText._ended(task) && !task.delivered);
    if (!going.length && !waiting.length) return null;
    const parts = [];
    if (going.length) {
      parts.push(`still going: ${going.map((task) => BackgroundTaskText.line(task, progressOf(task))).join('; ')}. `
        + 'Their results are sent to you automatically when they end: do not wait for them, check on them in a loop, or guess them');
    }
    if (waiting.length) {
      parts.push(`ended, with the result not given to you yet: ${waiting.map((task) => `${task.id} "${task.title}"`).join('; ')}. `
        + 'It reaches you in an automated message once this reply and the other tasks started with it have ended, or call background_task_status with its task_id to read it now');
    }
    return `[Background tasks in this conversation, ${parts.join('. Also ')}.]`;
  }

  static duration(ms) {
    const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
    if (seconds < 60) return `${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)} h ${rest < 10 ? '0' : ''}${rest} min`;
  }

  static _stateWithTime(task) {
    const word = BackgroundTaskText.STATE_WORDS[task.state] || task.state;
    if (task.state === BackgroundTask.QUEUED) return word;
    if (task.state === BackgroundTask.RUNNING) return `${word} for ${BackgroundTaskText.duration(task.durationMs)}`;
    const by = task.state === BackgroundTask.CANCELED && task.stoppedBy === 'user' ? ' by the user' : '';
    return `${word}${by} after ${BackgroundTaskText.duration(task.durationMs)}`;
  }

  static _ended(task) {
    return BackgroundTask.END_STATES.includes(task.state);
  }
}

module.exports = BackgroundTaskText;
