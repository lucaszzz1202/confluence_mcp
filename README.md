# Confluence MCP Server

MCP server for Confluence integration — read, write, search, and manage attachments via the Confluence REST API.

## Installation

```bash
npm install -g @mcd/confluence-mcp-server
```

Or use with npx:

```bash
npx @mcd/confluence-mcp-server
```

## Configuration

Add to your MCP settings (e.g. `~/.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "confluence-mcp": {
      "command": "npx",
      "args": ["@mcd/confluence-mcp-server@latest"],
      "env": {
        "CONFLUENCE_URL": "https://your-confluence.atlassian.net",
        "CONFLUENCE_USERNAME": "your-email@example.com",
        "CONFLUENCE_TOKEN": "your-api-token",
        "CONFLUENCE_CLOUD": "true"
      }
    }
  }
}
```

For local development, point directly to the compiled output:

```json
{
  "mcpServers": {
    "confluence-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "CONFLUENCE_URL": "...",
        "CONFLUENCE_USERNAME": "...",
        "CONFLUENCE_TOKEN": "...",
        "CONFLUENCE_CLOUD": "false"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CONFLUENCE_URL` | Your Confluence instance URL |
| `CONFLUENCE_USERNAME` | Your username or email |
| `CONFLUENCE_TOKEN` | Your API token or password |
| `CONFLUENCE_CLOUD` | `"true"` for Cloud, `"false"` for Server |

## Available Tools

### Pages
- `search` — Search Confluence content (CQL)
- `get_page` — Get page content by ID
- `get_page_children` — Get child pages of a parent page
- `create_page` — Create a new page
- `update_page` — Update page content (inline HTML or file path)

### Attachments
- `get_attachments` — List attachments on a page
- `download_attachment` — Download an attachment to local disk
- `upload_attachment` — Upload a local file as a page attachment, with optional embedding in page body

### Comments
- `get_comments` — Get page comments
- `add_comment` — Add a comment to a page

## Tool Examples

**Search:**
```json
{ "query": "space = DEV AND title ~ \"API\"", "limit": 10 }
```

**Update page with inline content:**
```json
{ "page_id": "123456", "content": "<h1>Title</h1><p>Updated content</p>" }
```

**Update page from file (recommended for large content):**
```json
{ "page_id": "123456", "content_file": "/absolute/path/to/content.html" }
```

**Upload attachment:**
```json
{ "page_id": "123456", "file_path": "/absolute/path/to/file.png" }
```

**Upload and embed in page body:**
```json
{
  "page_id": "123456",
  "file_path": "/absolute/path/to/image.png",
  "embed_in_body": true,
  "comment": "Optional comment"
}
```

Images are embedded as `<ac:image>`, other files as a `view-file` macro link.

## Development

```bash
npm install
npm run build
```
