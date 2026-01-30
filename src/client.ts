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
}
