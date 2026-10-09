# LumaBrowser REST API Guide

The LumaBrowser REST API provides HTTP endpoints for browser automation, extension functionality, and system health monitoring.

## Base URL

By default the API listens on `http://localhost:3000`. You can change the port in **Settings > General > API & MCP**.

## Health & Info

```
GET /api/health          # Server status and active extensions
GET /api/                # API route index
```

## Browser API (`/api/browser`)

### Tabs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/browser/tabs` | List all open tabs |
| POST | `/api/browser/tabs` | Create a new tab (`{ "url": "..." }`) |
| DELETE | `/api/browser/tabs/:id` | Close a tab |
| PATCH | `/api/browser/tabs/:id` | Navigate / refresh / execute JS |

### Tab Inspection

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/browser/tabs/:id/source` | Get page HTML source |
| GET | `/api/browser/tabs/:id/screenshot` | Capture tab screenshot |
| GET | `/api/browser/tabs/:id/console` | Get console log messages |
| GET | `/api/browser/tabs/:id/network` | Get network activity log |
| GET | `/api/browser/tabs/:id/element` | Get element info by selector |
| GET | `/api/browser/tabs/:id/table` | Extract table data |

### Tab Interaction

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/browser/tabs/:id/click` | Click an element (`{ "selector": "..." }`) |
| POST | `/api/browser/tabs/:id/fill` | Fill form fields (`{ "fields": [...] }`) |
| POST | `/api/browser/tabs/:id/wait` | Wait for element (`{ "selector": "...", "state": "visible" }`) |
| POST | `/api/browser/tabs/:id/scroll` | Scroll the page |
| POST | `/api/browser/tabs/:id/press-key` | Press a keyboard key |
| POST | `/api/browser/tabs/:id/dialog` | Handle a browser dialog |

## Extension APIs

Extensions register their own routes under `/api/ext/{extension-id}/`. Check `GET /api/` for the full route map of active extensions.

## Examples

### List tabs
```bash
curl http://localhost:3000/api/browser/tabs
```

### Create a tab
```bash
curl -X POST http://localhost:3000/api/browser/tabs \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Execute JavaScript in a tab
```bash
curl -X PATCH http://localhost:3000/api/browser/tabs/1 \
  -H "Content-Type: application/json" \
  -d '{"action": "executeJs", "script": "document.title"}'
```

### Get page source
```bash
curl http://localhost:3000/api/browser/tabs/1/source?type=clean
```

### Click an element
```bash
curl -X POST http://localhost:3000/api/browser/tabs/1/click \
  -H "Content-Type: application/json" \
  -d '{"selector": "button.submit"}'
```
