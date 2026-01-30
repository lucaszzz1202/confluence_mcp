import { ConfluenceClient } from "../client.js";
import { searchTool } from "./search.js";
import { getPageTool } from "./page.js";
import { getAttachmentsTool, downloadAttachmentTool } from "./attachment.js";
import { getCommentsTool, addCommentTool } from "./comment.js";
import {
  getPageChildrenTool,
  createPageTool,
  updatePageTool,
} from "./page-edit.js";

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (client: ConfluenceClient, args: any) => Promise<any>;
}

export const tools: Tool[] = [
  searchTool,
  getPageTool,
  getPageChildrenTool,
  getAttachmentsTool,
  downloadAttachmentTool,
  getCommentsTool,
  addCommentTool,
  createPageTool,
  updatePageTool,
];
