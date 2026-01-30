import { Tool } from "./index.js";

export const getPageTool: Tool = {
  name: "get_page",
  description: "Get Confluence page content",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
      },
      include_body: {
        type: "boolean",
        description: "Include page body content",
        default: true,
      },
    },
    required: ["page_id"],
  },
  handler: async (client, args) => {
    const { page_id, include_body = true } = args;
    
    const expand = include_body
      ? "body.storage,version,space,metadata.labels"
      : "version,space,metadata.labels";

    const page = await client.request<any>(
      `/content/${page_id}?expand=${expand}`
    );

    return {
      id: page.id,
      type: page.type,
      title: page.title,
      space: {
        key: page.space?.key,
        name: page.space?.name,
      },
      version: {
        number: page.version?.number,
        when: page.version?.when,
        by: page.version?.by?.displayName,
      },
      body: include_body ? page.body?.storage?.value : undefined,
      url: `${client["config"].url}${page._links?.webui}`,
      labels: page.metadata?.labels?.results?.map((l: any) => l.name) || [],
    };
  },
};
