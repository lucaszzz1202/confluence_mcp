# Confluence MCP Server

MCP server for Confluence integration.

## Installation

```bash
npm install -g @mcd/confluence-mcp-server
```

Or use with npx:

```bash
npx @mcd/confluence-mcp-server
```

## Configuration

Add to your MCP settings:

```json
{
  "confluence": {
    "command": "npx",
    "args": ["@mcd/confluence-mcp-server"],
    "env": {
      "CONFLUENCE_URL": "https://your-confluence.atlassian.net",
      "CONFLUENCE_USERNAME": "your-email@example.com",
      "CONFLUENCE_TOKEN": "your-api-token",
      "CONFLUENCE_CLOUD": "true"
    }
  }
}
```

## Environment Variables

- `CONFLUENCE_URL`: Your Confluence instance URL
- `CONFLUENCE_USERNAME`: Your username or email
- `CONFLUENCE_TOKEN`: Your API token or password
- `CONFLUENCE_CLOUD`: Set to "true" for Cloud, "false" for Server

## Available Tools

### Read Operations
- `search`: Search Confluence content
- `get_page`: Get page content by ID or title
- `get_page_children`: Get child pages of a parent page
- `get_attachments`: List page attachments
- `download_attachment`: Download an attachment
- `get_comments`: Get page comments
- `add_comment`: Add a comment to a page

### Write Operations
- `create_page`: Create a new Confluence page
- `update_page`: Update page content (supports both inline content and file input)

### Update Page Examples

**Update with inline content:**
```json
{
  "page_id": "123456",
  "title": "Updated Title",
  "content": "<h1>New Content</h1><p>Updated via API</p>"
}
```

**Update with file (recommended for large content):**
```json
{
  "page_id": "123456",
  "content_file": "/absolute/path/to/content.html"
}
```

**Features:**
- Supports both `content` (inline HTML) and `content_file` (file path)
- File size limit: 10MB
- UTF-8 encoding
- Supports absolute and relative paths (relative to working directory)
- Chinese error messages for better UX

## Development

```bash
npm install
npm run build
npm link
```
