export default class NetworkWatcherMarkup {
  static SETTINGS_HTML = `
    <div class="luma-statgrid ext-stat-grid watcher-stats">
      <div class="luma-stat stat-item">
        <span class="luma-stat-value stat-value" id="ext-nw-totalWatchers">0</span>
        <span class="luma-stat-label stat-label">Watchers</span>
      </div>
      <div class="luma-stat stat-item">
        <span class="luma-stat-value stat-value" id="ext-nw-enabledWatchers">0</span>
        <span class="luma-stat-label stat-label">Active</span>
      </div>
      <div class="luma-stat stat-item">
        <span class="luma-stat-value stat-value" id="ext-nw-totalTriggers">0</span>
        <span class="luma-stat-label stat-label">Captures</span>
      </div>
    </div>

    <div class="watcher-form ext-panel">
      <h4 class="luma-section-label">Add a watcher</h4>
      <div class="ext-form-grid form-grid">
        <div class="luma-field ext-form-grid-full form-grid-full">
          <label class="luma-field-label">URL pattern to watch</label>
          <input type="text" class="luma-field-input" id="ext-nw-urlPattern" placeholder="*example.com/api/data*">
          <div class="luma-field-help">Use * as a wildcard, for example *example.com/download*</div>
        </div>
        <div class="luma-field ext-form-grid-full form-grid-full">
          <label class="luma-field-label">Send captured response to</label>
          <input type="text" class="luma-field-input" id="ext-nw-sendTo" placeholder="https://mywebsite.com/webhooks/forwarded">
        </div>
        <div class="luma-field ext-form-grid-full form-grid-full">
          <label class="luma-field-label">Note (optional)</label>
          <input type="text" class="luma-field-input" id="ext-nw-note" placeholder="e.g. Orders feed from example.com">
        </div>
        <div class="luma-field">
          <label class="luma-field-label">HTTP method</label>
          <select class="luma-field-select" id="ext-nw-method">
            <option value="*">All methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Capture</label>
          <div class="ext-checkbox-group checkbox-group">
            <label class="luma-check checkbox-label">
              <input type="checkbox" id="ext-nw-captureHeaders"> Headers
            </label>
            <label class="luma-check checkbox-label">
              <input type="checkbox" id="ext-nw-captureBody"> Body
            </label>
          </div>
        </div>
      </div>
      <div class="luma-form-err ext-hidden" id="ext-nw-formErr"></div>
      <div class="luma-form-actions ext-form-buttons--start ext-mt-12">
        <button class="luma-btn primary" id="ext-nw-addBtn">Add watcher</button>
        <button class="luma-btn" id="ext-nw-testBtn">Send a test</button>
        <span class="luma-field-help" id="ext-nw-testResult" style="margin-top:0;"></span>
      </div>
    </div>

    <h4 class="luma-section-label ext-mt-16">Watchers</h4>
    <div class="luma-list watcher-list" id="ext-nw-watcherList"></div>

    <details class="ext-details">
      <summary>Forwarded webhook payload format</summary>
      <pre>{
  "watcherId": "watcher_123...",
  "note": "My Watcher",
  "timestamp": "2026-03-24T12:00:00.000Z",
  "request": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "headers": { "Content-Type": "application/json" }
  },
  "response": {
    "status": 200,
    "statusText": "OK",
    "mimeType": "application/json",
    "headers": { "Content-Type": "application/json" },
    "body": "{\\"data\\": ...}",
    "base64Encoded": false
  }
}</pre>
    </details>
    <details class="ext-details ext-mt-8">
      <summary>REST API: read the last captured response</summary>
      <pre>GET /api/watchers/{watcherId}/last-response

Response:
{
  "success": true,
  "watcherId": "watcher_123...",
  "lastCapturedResponse": {
    "watcherId": "watcher_123...",
    "timestamp": "2026-03-24T12:00:00.000Z",
    "request": { "url": "...", "method": "POST" },
    "response": { "status": 200, "body": "..." }
  }
}</pre>
    </details>
  `;
}
