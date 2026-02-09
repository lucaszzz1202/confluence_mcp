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

export const uploadAttachmentTool: Tool = {
  name: "upload_attachment",
  description:
    "Upload a file as an attachment to a Confluence page. The file must be specified by its absolute path on the local filesystem. Optionally embed the attachment in the page body.",
  inputSchema: {
    type: "object",
    properties: {
      page_id: {
        type: "string",
        description: "The Confluence page ID to attach the file to",
      },
      file_path: {
        type: "string",
        description: "Absolute path to the file to upload",
      },
      comment: {
        type: "string",
        description: "Optional comment for the attachment",
      },
      embed_in_body: {
        type: "boolean",
        description:
          "If true, append the attachment reference to the page body after upload. Images will be embedded as <ac:image>, other files as download links. Defaults to false.",
      },
    },
    required: ["page_id", "file_path"],
  },
  handler: async (client, args) => {
    const { page_id, file_path, comment, embed_in_body } = args;
    const { readFile, stat } = await import("fs/promises");
    const { basename, isAbsolute, extname } = await import("path");

    if (!isAbsolute(file_path)) {
      throw new Error(`文件路径必须是绝对路径，收到: ${file_path}`);
    }

    const stats = await stat(file_path);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error(
        `文件大小超过 10MB 限制: ${(stats.size / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const fileBuffer = await readFile(file_path);
    const fileName = basename(file_path);

    const response = await client.uploadAttachment(
      page_id,
      fileBuffer,
      fileName,
      comment
    );

    const uploaded = response.results?.[0];
    const result: any = {
      success: true,
      attachment_id: uploaded?.id,
      title: uploaded?.title || fileName,
      page_id,
      size: stats.size,
    };

    // 如果需要嵌入正文
    if (embed_in_body) {
      const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"];
      const ext = extname(fileName).toLowerCase();
      const isImage = imageExts.includes(ext);

      let attachmentHtml: string;
      if (isImage) {
        attachmentHtml = `<p><ac:image><ri:attachment ri:filename="${fileName}" /></ac:image></p>`;
      } else {
        attachmentHtml =
          `<p><ac:structured-macro ac:name="view-file" ac:schema-version="1">` +
          `<ac:parameter ac:name="name"><ri:attachment ri:filename="${fileName}" /></ac:parameter>` +
          `</ac:structured-macro></p>`;
      }

      // 获取当前页面内容和版本号
      const page = await client.request<any>(
        `/content/${page_id}?expand=body.storage,version`
      );
      const currentBody = page.body?.storage?.value || "";
      const newBody = currentBody + attachmentHtml;
      const newVersion = page.version.number + 1;

      await client.request(`/content/${page_id}`, {
        method: "PUT",
        body: JSON.stringify({
          version: { number: newVersion },
          title: page.title,
          type: "page",
          body: {
            storage: {
              value: newBody,
              representation: "storage",
            },
          },
        }),
      });

      result.embedded = true;
      result.embed_type = isImage ? "image" : "file-link";
    }

    return result;
  },
};


