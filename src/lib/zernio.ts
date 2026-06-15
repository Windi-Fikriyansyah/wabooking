const ZERNIO_API_URL = process.env.ZERNIO_API_URL || "https://api.zernio.com"

export class ZernioClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = `${ZERNIO_API_URL}/v1`
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error")
      throw new Error(`Zernio API ${res.status}: ${err}`)
    }

    return res.json().catch(() => ({}))
  }

  async sendText(to: string, message: string): Promise<boolean> {
    await this.request("POST", "/messages/send", {
      to,
      type: "text",
      text: { body: message },
    })
    return true
  }

  async sendButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<boolean> {
    await this.request("POST", "/messages/send", {
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    })
    return true
  }

  async sendList(
    to: string,
    header: string,
    body: string,
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  ): Promise<boolean> {
    await this.request("POST", "/messages/send", {
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: header },
        body: { text: body },
        action: {
          button: "Pilih",
          sections: sections.map((s) => ({
            title: s.title,
            rows: s.rows.map((r) => ({
              id: r.id,
              title: r.title,
              ...(r.description && { description: r.description }),
            })),
          })),
        },
      },
    })
    return true
  }

  async checkConnection(): Promise<{
    connected: boolean
    waNumber?: string
    error?: string
  }> {
    try {
      const result = await this.request("GET", "/status")
      return {
        connected: result.connected ?? true,
        waNumber: result.waNumber,
      }
    } catch (err: any) {
      return {
        connected: false,
        error: err.message,
      }
    }
  }
}
