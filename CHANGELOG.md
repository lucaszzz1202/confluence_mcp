# Changelog

All notable changes to this project will be documented in this file.

## [1.0.4] - 2025-01-30

### Added
- Added `content_file` parameter support to `update_page` tool
  - Allows updating pages from file content (recommended for large HTML files)
  - Supports both absolute and relative file paths
  - File size limit: 10MB
  - UTF-8 encoding support
  - Comprehensive error handling with Chinese error messages
- **New `utils` module for better code organization**
  - `utils/file.ts`: File reading with size validation and error handling
  - `utils/html.ts`: HTML formatting for Confluence Storage Format (XHTML)

### Changed
- Enhanced `update_page` tool description with usage guidelines
- Improved parameter validation (content and content_file are mutually exclusive)
- **Required at least one of: title, content, or content_file to update a page**
- **Refactored file operations into utils module**

### Fixed
- Better error messages for file operations (file not found, permission denied, size exceeded)
- **Fixed issue where calling update_page with only page_id would not throw an error**
- **Fixed XHTML parsing errors by auto-escaping unescaped & characters**
- **Auto-cleanup of HTML structure (removes DOCTYPE, html, head, body tags)**

## [1.0.3] - 2025-01-30

### Fixed
- Fixed executable permission for dist/index.js to resolve "Permission denied" error
- Package now properly executable when installed globally or via npx

## [1.0.2] - 2025-01-30

### Fixed
- Cleaned up dist directory to remove old label-related compiled files
- Package now only contains the 9 core tools

## [1.0.1] - 2025-01-30

### Removed
- Removed `get_labels` tool - Low usage frequency
- Removed `add_label` tool - Low usage frequency
- Removed `remove_label` tool - Low usage frequency
- Removed `delete_page` tool - Dangerous operation with low usage frequency

### Changed
- Streamlined tool count from 13 to 9 core tools
- Improved focus on essential read/write operations

## [1.0.0] - 2025-01-30

### Added
- Initial release with 13 tools
- Search functionality
- Page management (CRUD operations)
- Attachment management
- Comment management
- Label management
