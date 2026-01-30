import { Tool } from "./index.js";

export const getCommentsTool: Tool = {
  name: "get_comments",
  description: "Get comments from a Confluence page",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
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
    required: ["page_id"],
  },
  handler: async (client, args) => {
    const { page_id, limit = 25, start = 0 } = args;

    const response = await client.request<any>(
      `/content/${page_id}/child/comment?limit=${limit}&start=${start}&expand=body.view,version`
    );

    return {
      total: response.size,
      comments: response.results.map((comment: any) => ({
        id: comment.id,
        type: comment.type,
        title: comment.title,
        body: comment.body?.view?.value,
        version: comment.version?.number,
        when: comment.version?.when,
        by: comment.version?.by?.displayName,
      })),
    };
  },
};

export const addCommentTool: Tool = {
  name: "add_comment",
  description: "Add a comment to a Confluence page",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
      },
      content: {
        type: "string",
        description: "Comment content (HTML or plain text)",
      },
    },
    required: ["page_id", "content"],
  },
  handler: async (client, args) => {
    const { page_id, content } = args;

    const response = await client.request<any>(`/content`, {
      method: "POST",
      body: JSON.stringify({
        type: "comment",
        container: {
          id: page_id,
          type: "page",
        },
        body: {
          storage: {
            value: content,
            representation: "storage",
          },
        },
      }),
    });

    return {
      success: true,
      comment_id: response.id,
      url: response._links?.webui,
    };
  },
};
