const BackgroundTask = require('./BackgroundTask');

class BackgroundTaskText {
  static NOTE = [
    'Slow tool calls and background tasks: a tool call that is still going after a few seconds is moved to the',
    'background by the app. Its answer then says so and names a task id, and you go on at once. When you already',
    'know a call will take minutes (a long command in the terminal, several image or video renders), start it there',
    'yourself: call run_in_background with tool: the name of the tool, arguments: exactly what you would pass that',
    'tool, and title: a few words the user will see. To queue several, call it once for each. While a task runs,',
    'go on with whatever else the user asked that does not need its result. The result is handed to you the',
    'moment it is ready: inside this reply when you are still working, otherwise in a message marked as automated',
    'after your reply has ended, and you answer the user from it then. When nothing else is left to do, tell the',
    'user what is still running and end your reply. Renders are the exception: a queued image or video render does',
    'not start until your reply has ended, so queue every one the user asked for, say what you queued and end your',
    'reply. Do not wait, sleep or check in a loop for a task, and never state a result you have not been given: a',
    'task has not finished, and has made nothing, until its result is in front of you. background_task_status is',
    'for when the user asks how a task is going; stop_background_task stops one.',
  ].join(' ');

  static GO_ON = 'Its result is handed to you the moment it is ready. Go on with anything else the user asked that does '
    + 'not need it. When nothing is left, tell the user it is still running and end your reply. Do not wait for it or '
    + 'check on it, and never state its result before you are given it.';

  static AUTOMATED_HEAD = '[Automated message from LumaBrowser, not written by the user. Background tasks you started have ended. '
    + 'The user has not seen these results.]';

  static AUTOMATED_FOOT = 'Tell the user the outcome now, in your own words, from what is written above only. '
    + 'If a task failed or was stopped, say so plainly.';

  static IN_REPLY_HEAD = '[Automated message from LumaBrowser, not written by the user. A background task ended while you '
    + 'were working on this reply. The user has not seen its result.]';

  static IN_REPLY_FOOT = 'Use it in the reply you are writing: tell the user the outcome in your own words, from what '
    + 'is written above only. If a task failed, say so plainly.';

  static STATE_WORDS = {
    [BackgroundTask.QUEUED]: 'queued',
    [BackgroundTask.RUNNING]: 'running',
    [BackgroundTask.DONE]: 'finished',
    [BackgroundTask.FAILED]: 'failed',
    [BackgroundTask.CANCELED]: 'stopped',
  };

  static started(task, queuedAhead = 0) {
    if (task.state !== BackgroundTask.QUEUED) return `Task ${task.id} "${task.title}" is running in the background. ${BackgroundTaskText.GO_ON}`;
    const place = queuedAhead > 0
      ? `is queued behind ${queuedAhead} other${queuedAhead === 1 ? '' : 's'} and starts when they are done`
      : 'is queued and starts when this reply has ended';
    return `Task ${task.id} "${task.title}" ${place}. It has not run yet and has made nothing. Queue anything else the user `
      + 'asked for now, then tell the user what is queued and end your reply. The results are sent to you automatically when '
      + 'it and the other tasks from this reply have ended: do not wait for them, check on them, or describe them before then.';
  }

  static movedToBackground(task, waitedMs) {
    return `${task.tool} was still going after ${BackgroundTaskText.duration(waitedMs)}, so it now runs in the background as task `
      + `${task.id} "${task.title}". You do not have its result yet. ${BackgroundTaskText.GO_ON}`;
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

  static handOver(tasks) {
    return [BackgroundTaskText.IN_REPLY_HEAD, ...tasks.map((task) => BackgroundTaskText.outcome(task)), BackgroundTaskText.IN_REPLY_FOOT].join('\n\n');
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
        + 'What it made is shown to the user, and reported to you, in an automated message once this reply and the other tasks started with it have ended; or call background_task_status with its task_id to read it now');
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
