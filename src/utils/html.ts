/**
 * HTML 格式化工具模块
 * 用于将普通 HTML 转换为 Confluence Storage Format (XHTML)
 */

/**
 * 转义 HTML 中未转义的 & 字符
 * Confluence 使用 XHTML storage format，要求 & 必须写成 &amp;
 * 
 * @param html 原始 HTML 内容
 * @returns 转义后的 HTML
 */
export function escapeUnescapedAmpersands(html: string): string {
  // 匹配未转义的 & 字符
  // 已转义的形式：&amp; &lt; &gt; &quot; &apos; &#数字; &#x十六进制;
  // 使用负向前瞻排除已转义的情况
  return html.replace(/&(?!(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

/**
 * 清理 HTML 内容，使其符合 Confluence Storage Format
 * 
 * @param html 原始 HTML 内容
 * @returns 清理后的 HTML
 */
export function cleanHtmlForConfluence(html: string): string {
  let result = html;

  // 1. 转义未转义的 & 字符
  result = escapeUnescapedAmpersands(result);

  // 2. 移除 DOCTYPE 声明（Confluence 不需要）
  result = result.replace(/<!DOCTYPE[^>]*>/gi, '');

  // 3. 移除 <html>, <head>, <body> 标签，只保留内容
  result = result.replace(/<html[^>]*>/gi, '');
  result = result.replace(/<\/html>/gi, '');
  result = result.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  result = result.replace(/<body[^>]*>/gi, '');
  result = result.replace(/<\/body>/gi, '');

  // 4. 移除 <meta> 和 <title> 标签
  result = result.replace(/<meta[^>]*>/gi, '');
  result = result.replace(/<title>[\s\S]*?<\/title>/gi, '');

  // 5. 移除多余的空白行
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

  // 6. 去除首尾空白
  result = result.trim();

  return result;
}

/**
 * 格式化 HTML 内容用于 Confluence 更新
 * 
 * @param content HTML 内容
 * @param isHtmlFile 是否为 HTML 文件（.html/.htm）
 * @returns 格式化后的内容
 */
export function formatHtmlForConfluence(content: string, isHtmlFile: boolean): string {
  if (isHtmlFile) {
    return cleanHtmlForConfluence(content);
  }
  // 非 HTML 文件也需要转义 & 字符
  return escapeUnescapedAmpersands(content);
}
