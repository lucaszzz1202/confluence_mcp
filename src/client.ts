export interface ConfluenceConfig {
  url: string;
  username: string;
  token: string;
  isCloud: boolean;
}

export class ConfluenceClient {
  private config: ConfluenceConfig;
  private authHeader: string;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    // For Server: token is the full auth token, for Cloud: username:token
    if (config.isCloud) {
      // Cloud uses Basic Auth with username:token
      this.authHeader = `Basic ${Buffer.from(
        `${config.username}:${config.token}`
      ).toString("base64")}`;
    } else {
      // Server uses Bearer token or Basic with token as password
      this.authHeader = `Bearer ${config.token}`;
    }
  }

  private getApiUrl(path: string): string {
    const baseUrl = this.config.url.replace(/\/$/, "");
    // Cloud uses v2, Server uses just /rest/api
    if (this.config.isCloud) {
      return `${baseUrl}/rest/api/v2${path}`;
    } else {
      return `${baseUrl}/rest/api${path}`;
    }
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getApiUrl(path);
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      // 尝试获取响应体中的详细错误信息
      let errorDetail = '';
      try {
        const errorBody = await response.json();
        if (errorBody.message) {
          errorDetail = errorBody.message;
        } else if (errorBody.errorMessage) {
          errorDetail = errorBody.errorMessage;
        } else if (errorBody.data?.errors) {
          errorDetail = JSON.stringify(errorBody.data.errors);
        } else {
          errorDetail = JSON.stringify(errorBody);
        }
      } catch {
        // 如果无法解析 JSON，尝试获取文本
        try {
          errorDetail = await response.text();
        } catch {
          errorDetail = response.statusText;
        }
      }
      throw new Error(
        `Confluence API error: ${response.status} - ${errorDetail}`
      );
    }

    return response.json();
  }

  async downloadFile(path: string): Promise<Buffer> {
    // Download path is already a relative URL, just prepend base URL
    const baseUrl = this.config.url.replace(/\/$/, "");
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Confluence API error: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }


    async uploadAttachment(
          pageId: string,
          fileBuffer: Buffer,
          fileName: string,
          comment?: string
        ): Promise<any> {
          const baseUrl = this.config.url.replace(/\/$/, "");
          const baseAttachmentUrl = `${baseUrl}/rest/api/content/${pageId}/child/attachment`;

          const buildBody = () => {
            const boundary = `----FormBoundary${Date.now()}`;
            const parts: Buffer[] = [];

            parts.push(
              Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
              )
            );
            parts.push(fileBuffer);
            parts.push(Buffer.from("\r\n"));

            if (comment) {
              parts.push(
                Buffer.from(
                  `--${boundary}\r\nContent-Disposition: form-data; name="comment"\r\n\r\n${comment}\r\n`
                )
              );
            }

            parts.push(Buffer.from(`--${boundary}--\r\n`));
            return {
              body: Buffer.concat(parts),
              contentType: `multipart/form-data; boundary=${boundary}`,
            };
          };

          const makeHeaders = (contentType: string) => ({
            Authorization: this.authHeader,
            "Content-Type": contentType,
            "X-Atlassian-Token": "nocheck",
          });

          // 先尝试 POST（新建附件）
          const first = buildBody();
          let response = await fetch(baseAttachmentUrl, {
            method: "POST",
            headers: makeHeaders(first.contentType),
            body: first.body,
          });

          // 同名附件已存在（400），查找已有附件 ID，用 POST .../data 更新
          if (response.status === 400) {
            const attachments = await this.request<any>(
              `/content/${pageId}/child/attachment?filename=${encodeURIComponent(fileName)}`
            );
            const existing = attachments.results?.[0];
            if (existing) {
              const updateUrl = `${baseAttachmentUrl}/${existing.id}/data`;
              const second = buildBody();
              response = await fetch(updateUrl, {
                method: "POST",
                headers: makeHeaders(second.contentType),
                body: second.body,
              });
            }
          }

          if (!response.ok) {
            let errorDetail = "";
            try {
              const errorBody = await response.json();
              errorDetail = errorBody.message || JSON.stringify(errorBody);
            } catch {
              errorDetail = response.statusText;
            }
            throw new Error(
              `Upload attachment failed: ${response.status} - ${errorDetail}`
            );
          }

          return response.json();
        }




}
