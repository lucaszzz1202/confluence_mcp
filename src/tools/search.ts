import { Tool } from "./index.js";

export const searchTool: Tool = {
  name: "search",
  description: "Search Confluence content",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (CQL)",
      },
      limit: {
        type: "number",
        description: "Maximum number of results",
        default: 10,
      },
    },
    required: ["query"],
  },
  handler: async (client, args) => {
    const { query, limit = 10 } = args;
    
    const response = await client.request<any>(
      `/search?cql=${encodeURIComponent(query)}&limit=${limit}`
    );

    return {
      total: response.size || response.totalSize,
      results: response.results.map((item: any) => ({
        id: item.content?.id || item.id,
        type: item.content?.type || item.type,
        title: item.content?.title || item.title,
        url: item.url || item._links?.webui,
        excerpt: item.excerpt,
      })),
    };
  },
};
