import { Tool } from "./index.js";
import { readFileContent, formatHtmlForConfluence, escapeUnescapedAmpersands } from "../utils/index.js";

export const getPageChildrenTool: Tool = {
  name: "get_page_children",
  description: "Get child pages of a Confluence page",
  inputSchema: {
    type: "object",
    properties: {
      parent_id: {
        type: "string",
        description: "Parent page ID",
      },
      limit: {
        type: "number",
        description: "Maximum number of results",
        default: 25,
      },
      start: {
        type: "number",
        description: "Start index for pagination",
        default: 0,
      },
    },
    required: ["parent_id"],
  },
  handler: async (client, args) => {
    const { parent_id, limit = 25, start = 0 } = args;

    const response = await client.request<any>(
      `/content/${parent_id}/child/page?limit=${limit}&start=${start}&expand=version,space`
    );

    return {
      total: response.size,
      children: response.results.map((page: any) => ({
        id: page.id,
        type: page.type,
        title: page.title,
        space: {
          key: page.space?.key,
          name: page.space?.name,
        },
        version: page.version?.number,
        url: page._links?.webui,
      })),
    };
  },
};

export const createPageTool: Tool = {
  name: "create_page",
  description: "Create a new Confluence page",
  inputSchema: {
    type: "object",
    properties: {
      space_key: {
        type: "string",
        description: "Space key",
      },
      title: {
        type: "string",
        description: "Page title",
      },
      content: {
        type: "string",
        description: "Page content (HTML)",
      },
      parent_id: {
        type: "string",
        description: "Parent page ID (optional)",
      },
    },
    required: ["space_key", "title", "content"],
  },
  handler: async (client, args) => {
    const { space_key, title, content, parent_id } = args;

    // 转义内容中的 & 字符
    const formattedContent = escapeUnescapedAmpersands(content);

    const body: any = {
      type: "page",
      title,
      space: {
        key: space_key,
      },
      body: {
        storage: {
          value: formattedContent,
          representation: "storage",
        },
      },
    };

    if (parent_id) {
      body.ancestors = [{ id: parent_id }];
    }

    const response = await client.request<any>(`/content`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      success: true,
      page_id: response.id,
      title: response.title,
      url: response._links?.webui,
    };
  },
};

export const updatePageTool: Tool = {
  name: "update_page",
  description: "Update a Confluence page with new content.\n\nIMPORTANT: For large HTML files, use 'content_file' parameter to provide the file path.\nThe tool automatically handles:\n- Escaping unescaped & characters to &amp;\n- Cleaning HTML structure (removes DOCTYPE, html, head, body tags)",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
      },
      title: {
        type: "string",
        description: "New title (optional, keeps existing if not provided)",
      },
      content: {
        type: "string",
        description: "New content HTML (provide either 'content' or 'content_file', not both)",
      },
      content_file: {
        type: "string",
        description: "Absolute path to HTML file (alternative to 'content', recommended for large files). Must be an absolute path like /Users/xxx/file.html",
      },
      minor_edit: {
        type: "boolean",
        description: "Mark as minor edit",
        default: false,
      },
    },
    required: ["page_id"],
  },
  handler: async (client, args) => {
    const { page_id, title, content, content_file, minor_edit = false } = args;

    // 参数验证：content 和 content_file 不能同时提供
    if (content && content_file) {
      throw new Error("不能同时提供 'content' 和 'content_file' 参数，请只使用其中一个");
    }

    // 参数验证：至少需要提供 title、content 或 content_file 中的一个
    if (!title && !content && !content_file) {
      throw new Error("必须提供 'title'、'content' 或 'content_file' 中的至少一个参数来更新页面");
    }

    // 处理内容
    let finalContent: string | undefined;
    if (content_file) {
      // 从文件读取内容
      const fileResult = await readFileContent(content_file);
      // 格式化 HTML 内容（转义 & 字符，清理 HTML 结构）
      finalContent = formatHtmlForConfluence(fileResult.content, fileResult.isHtml);
    } else if (content) {
      // 直接使用传入的内容，也需要转义 & 字符
      finalContent = formatHtmlForConfluence(content, false);
    }

    // 先获取当前页面信息
    const currentPage = await client.request<any>(
      `/content/${page_id}?expand=body.storage,version`
    );

    const body: any = {
      version: {
        number: currentPage.version.number + 1,
        minorEdit: minor_edit,
      },
      type: "page",
      title: title || currentPage.title,
    };

    if (finalContent) {
      body.body = {
        storage: {
          value: finalContent,
          representation: "storage",
        },
      };
    }

    const response = await client.request<any>(`/content/${page_id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return {
      success: true,
      page_id: response.id,
      title: response.title,
      version: response.version?.number,
      url: response._links?.webui,
    };
  },
};
