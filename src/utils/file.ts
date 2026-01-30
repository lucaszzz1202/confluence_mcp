/**
 * 文件操作工具模块
 */
import * as fs from 'fs/promises';
import * as path from 'path';

// 文件大小限制：10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface FileReadResult {
  content: string;
  filePath: string;
  size: number;
  isHtml: boolean;
}

/**
 * 读取文件内容
 * @param filePath 文件路径（必须是绝对路径）
 * @returns 文件内容和元信息
 */
export async function readFileContent(filePath: string): Promise<FileReadResult> {
  // 验证必须是绝对路径
  if (!path.isAbsolute(filePath)) {
    throw new Error(`文件路径必须是绝对路径，请提供完整路径如 /Users/xxx/file.html，收到: ${filePath}`);
  }

  try {
    // 检查文件是否存在并获取大小
    const stats = await fs.stat(filePath);

    // 检查文件大小
    if (stats.size > MAX_FILE_SIZE) {
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      throw new Error(`文件大小超过 10MB 限制: ${fileSizeMB}MB`);
    }

    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf-8');

    // 判断是否为 HTML 文件
    const ext = path.extname(filePath).toLowerCase();
    const isHtml = ext === '.html' || ext === '.htm';

    return {
      content,
      filePath,
      size: stats.size,
      isHtml,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`找不到文件: ${filePath}`);
    } else if (error.code === 'EACCES') {
      throw new Error(`没有权限读取文件: ${filePath}`);
    } else if (error.message.includes('文件大小超过') || error.message.includes('文件路径必须是绝对路径')) {
      throw error;
    } else {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }
}
