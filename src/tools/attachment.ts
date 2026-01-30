import { Tool } from "./index.js";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

export const getAttachmentsTool: Tool = {
  name: "get_attachments",
  description: "Get attachments from a Confluence page",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
      },
    },
    required: ["page_id"],
  },
  handler: async (client, args) => {
    const { page_id } = args;

    const response = await client.request<any>(
      `/content/${page_id}/child/attachment?expand=version`
    );

    return {
      total: response.size,
      attachments: response.results.map((att: any) => ({
        id: att.id,
        title: att.title,
        mediaType: att.metadata?.mediaType,
        fileSize: att.extensions?.fileSize,
        comment: att.metadata?.comment || "",
        version: att.version?.number,
        downloadUrl: att._links?.download,
      })),
    };
  },
};

export const downloadAttachmentTool: Tool = {
  name: "download_attachment",
  description: "Download a Confluence attachment",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "Page ID",
      },
      attachment_id: {
        type: "string",
        description: "Attachment ID",
      },
      output_path: {
        type: "string",
        description: "Output file path (absolute or relative)",
      },
    },
    required: ["page_id", "attachment_id", "output_path"],
  },
  handler: async (client, args) => {
    const { page_id, attachment_id, output_path } = args;

    // 获取附件信息
    const attachments = await client.request<any>(
      `/content/${page_id}/child/attachment?expand=version`
    );

    const attachment = attachments.results.find(
      (att: any) => att.id === attachment_id
    );

    if (!attachment) {
      throw new Error(`Attachment not found: ${attachment_id}`);
    }

    const filename = attachment.title;
    const downloadPath = attachment._links?.download;

    if (!downloadPath) {
      throw new Error("Download link not available");
    }

    // 下载文件
    const content = await client.downloadFile(downloadPath);

    // 判断 output_path 是文件还是目录
    let filepath: string;
    if (output_path.includes(".")) {
      // 包含扩展名，认为是完整文件路径
      filepath = output_path;
      mkdirSync(dirname(filepath), { recursive: true });
    } else {
      // 是目录，追加文件名
      mkdirSync(output_path, { recursive: true });
      filepath = `${output_path}/${filename}`;
    }

    // 保存文件
    writeFileSync(filepath, content);

    return {
      success: true,
      filename,
      filepath,
      size: content.length,
      attachment_id,
    };
  },
};
