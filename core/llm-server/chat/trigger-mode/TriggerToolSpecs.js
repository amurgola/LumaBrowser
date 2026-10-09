class TriggerToolSpecs {
  static create() {
    return {
      name: 'create_trigger',
      mutating: true,
      description: 'Create the trigger defined in this conversation. Call ONLY after the user has '
        + 'confirmed the summary. `prompt` is the complete, self-contained instruction each '
        + 'fire executes; `mode` is agent (tools) or prompt (no tools). `kind` webhook (default): '
        + '`respond` is ack or result; returns the webhook URL(s). `kind` file: `dir` is the '
        + 'absolute folder to watch (required), `glob` filters names (default *), `file_events` '
        + 'is a subset of add/change/remove (default add+change), `allow_write` lets runs write '
        + 'files inside that folder. `kind` page: `monitor_id` is a Page Watcher monitor id. '
        + 'Optional for any kind: `expect` (JSON-shape check on the result) and `artifact_root_id` '
        + '(live artifact the run must update). The trigger starts unarmed, awaiting a sample '
        + 'event. Fails if this conversation already has a trigger.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short human-readable name, e.g. "Slack support bot" or "CSV drop folder"' },
          prompt: { type: 'string', description: 'The full self-contained instruction the run executes for each event' },
          mode: { type: 'string', enum: ['agent', 'prompt'], description: 'agent = run with this chat\'s tools (default); prompt = no tools' },
          agent_id: { type: 'string', description: 'agent mode only: run through this configured agent (id from <agents>) instead of the trigger\'s own agent' },
          kind: { type: 'string', enum: ['webhook', 'file', 'page', 'notification'], description: 'Event source (default webhook)' },
          host: { type: 'string', description: 'notification only: the site whose notifications count, e.g. discord.com (sub-domains included)' },
          tab_partition: { type: 'string', description: 'notification only: a persisted tab\'s partition from <persisted_tabs>; only that tab\'s notifications count' },
          respond: { type: 'string', enum: ['ack', 'result'], description: 'webhook only: ack = 202 immediately (default); result = sender waits for the run\'s answer' },
          preset: { type: 'string', enum: ['generic', 'slack', 'github'], description: 'webhook only: sender preset (verification, dedupe, ack shape); default generic' },
          auth_header: { type: 'string', description: 'webhook generic only: header whose value must equal the trigger\'s secret, e.g. X-Api-Key' },
          monitor_id: { type: 'string', description: 'page only: the Page Watcher monitor id' },
          expect: { type: 'object', description: 'Optional { key: matcher } JSON-shape check on the run result' },
          artifact_root_id: { type: 'string', description: 'Optional live artifact rootId the run must update via update_artifact_data' },
          filter: { type: 'object', description: 'Optional { "dotted.path": matcher } pre-filter over the event; non-matching events are logged as filtered and never run' },
          cooldown_seconds: { type: 'number', description: 'Optional: ignore events within N seconds of the last accepted one' },
          batch_seconds: { type: 'number', description: 'Optional: collect events for N seconds and run once with all of them' },
          batch_max: { type: 'number', description: 'Optional: flush the batch early at this many events (default 25)' },
          auto_pause_after: { type: 'number', description: 'Pause after this many consecutive failed runs (default 3; 0 = never)' },
          notify_failures: { type: 'boolean', description: 'Desktop notification on failed runs (default true)' },
          retry_max: { type: 'number', description: 'Automatic retries of a run that failed on a runtime error (default 1; 0 = never; max 5)' },
          retry_backoff_seconds: { type: 'number', description: 'First retry delay in seconds, doubling per attempt (default 30)' },
          approval: { type: 'string', enum: ['auto', 'ask'], description: 'ask = park the run and ask the user before any state-changing tool (default auto = never ask)' },
          approved_tools: { type: 'array', items: { type: 'string' }, description: 'Tools always allowed for this trigger without asking' },
          quiet_hours: { type: 'object', description: 'Optional { start: "HH:MM", end: "HH:MM", days?: [0-6], mode?: "defer"|"skip" } local-time window during which events are held (defer) or skipped' },
          memory: { type: 'boolean', description: 'Optional: keep persistent memory across runs (notes + a digest of recent runs); default false' },
          memory_runs: { type: 'number', description: 'Optional: how many recent runs each run is shown (default 5, 0 = notes only)' },
          bot_guard: { type: 'boolean', description: 'slack/github: skip bot-authored events so the trigger cannot answer itself (default true)' },
          dir: { type: 'string', description: 'file only: absolute path of the folder to watch' },
          glob: { type: 'string', description: 'file only: name pattern, e.g. *.csv (default *)' },
          file_events: { type: 'array', items: { type: 'string', enum: ['add', 'change', 'remove'] }, description: 'file only: which events fire (default add, change)' },
          recursive: { type: 'boolean', description: 'file only: include sub-folders (default false)' },
          allow_write: { type: 'boolean', description: 'file only: let runs write files inside the folder (default false)' },
        },
        required: ['title', 'prompt'],
      },
    };
  }

  static setSample() {
    return {
      name: 'set_sample',
      mutating: true,
      description: 'Store a representative sample event for this conversation\'s trigger, for '
        + 'test_trigger to run against. Webhook: use when the user pastes or describes what the '
        + 'sender will POST; `sample` is the request BODY (a JSON object, or a string for plain '
        + 'text). File: `sample` is the path of a file that already exists inside the watched '
        + 'folder. Page: `sample` may be omitted; the monitor\'s latest check is used. Replaces any '
        + 'captured sample.',
      inputSchema: {
        type: 'object',
        properties: { sample: { description: 'Webhook: the request body (JSON object or string). File: a path inside the watched folder. Notification: the text, or JSON { title, body }. Page: omit.' } },
      },
    };
  }

  static test() {
    return {
      name: 'test_trigger',
      mutating: true,
      description: 'Run this conversation\'s trigger once against its stored sample event, for '
        + 'real (tools included), and return the outcome. A passing test is what allows the '
        + 'trigger to be armed. Requires a sample.',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  static update() {
    return {
      name: 'update_trigger',
      mutating: true,
      description: 'Change this conversation\'s trigger: any of title, prompt (full replacement), '
        + 'mode (agent|prompt), respond (ack|result, webhook), dir / glob / file_events / '
        + 'recursive / allow_write (file), or enabled (true arms it, false pauses it). Arming '
        + 'requires a passing test of the current configuration; a prompt/mode/respond/'
        + 'allow_write change disarms the trigger until re-tested. Pass run_test true to test '
        + 'right after updating. Only pass the fields being changed.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          prompt: { type: 'string', description: 'New full self-contained instruction (replaces the old one entirely)' },
          mode: { type: 'string', enum: ['agent', 'prompt'] },
          agent_id: { type: 'string', description: 'Run through this configured agent; empty string goes back to the trigger\'s own agent' },
          respond: { type: 'string', enum: ['ack', 'result'] },
          preset: { type: 'string', enum: ['generic', 'slack', 'github'] },
          auth_header: { type: 'string', description: 'webhook generic: header that must equal the secret; empty string clears' },
          expect: { type: 'object', description: 'New { key: matcher } result-shape check; null clears' },
          artifact_root_id: { type: 'string', description: 'New live artifact rootId to feed; empty string clears' },
          filter: { type: 'object', description: 'New pre-filter; null clears' },
          cooldown_seconds: { type: 'number', description: 'New cooldown; 0 clears' },
          batch_seconds: { type: 'number', description: 'New batch window; 0 clears' },
          batch_max: { type: 'number', description: 'New batch flush size' },
          auto_pause_after: { type: 'number', description: 'New failure threshold (0 = never pause)' },
          notify_failures: { type: 'boolean' },
          retry_max: { type: 'number', description: 'New retry count (0 = never retry)' },
          retry_backoff_seconds: { type: 'number', description: 'New first retry delay' },
          approval: { type: 'string', enum: ['auto', 'ask'] },
          approved_tools: { type: 'array', items: { type: 'string' }, description: 'Replace the always-allowed tool list; empty clears' },
          quiet_hours: { type: 'object', description: 'New quiet-hours window; null clears' },
          memory: { type: 'boolean', description: 'true turns persistent memory on, false off (the notes are kept until cleared)' },
          memory_runs: { type: 'number', description: 'New number of recent runs shown to each run' },
          clear_memory: { type: 'boolean', description: 'true wipes the saved notes' },
          bot_guard: { type: 'boolean', description: 'false disables the bot loop guard; true restores it' },
          dir: { type: 'string', description: 'file only: new absolute folder to watch' },
          glob: { type: 'string', description: 'file only: new name pattern' },
          file_events: { type: 'array', items: { type: 'string', enum: ['add', 'change', 'remove'] } },
          recursive: { type: 'boolean' },
          allow_write: { type: 'boolean' },
          enabled: { type: 'boolean', description: 'true = arm (needs a passing test), false = pause' },
          run_test: { type: 'boolean', description: 'Run a test after updating (default false)' },
        },
      },
    };
  }

  static rollback() {
    return {
      name: 'rollback_trigger',
      mutating: true,
      description: 'Make an earlier instruction version of this conversation\'s trigger live again '
        + '(see `versions` in the state). A version a passing test vouched for is armable at once '
        + 'and keeps the trigger armed if it was; any other needs a new test.',
      inputSchema: {
        type: 'object',
        properties: { version: { type: 'number', description: 'The version number to restore (n)' } },
        required: ['version'],
      },
    };
  }
}

module.exports = TriggerToolSpecs;
