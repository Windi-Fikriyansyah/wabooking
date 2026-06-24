const ZERNIO_API_URL = process.env.ZERNIO_API_URL || "https://zernio.com/api"

export class ZernioClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.ZERNIO_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("ZERNIO_API_KEY tidak ditemukan di environment variables")
    }
    this.baseUrl = ZERNIO_API_URL
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

  async getUser(): Promise<{ id: string; email: string } | null> {
    try {
      const data = await this.request("GET", "/v1/users")
      return data.currentUser ?? data.user ?? data[0] ?? data
    } catch {
      return null
    }
  }

  async getProfiles(): Promise<{ id: string; name: string }[]> {
    const data = await this.request("GET", "/v1/profiles")
    const profiles = data.profiles ?? data ?? []
    return (Array.isArray(profiles) ? profiles : []).map((p: any) => ({
      id: p._id ?? p.id,
      name: p.name,
    }))
  }

  async getAccounts(
    platform?: string
  ): Promise<{ id: string; platform: string; username: string; status: string; name?: string; phone?: string }[]> {
    const params = platform ? `?platform=${platform}` : ""
    const data = await this.request("GET", `/v1/accounts${params}`)
    const raw = data.accounts ?? data?.data?.accounts ?? data ?? []
    const accounts = Array.isArray(raw) ? raw : []
    return accounts.map((a: any) => ({
      id: a._id ?? a.id,
      platform: a.platform,
      username: a.username ?? a.displayName ?? a.name ?? "",
      status: a.status === "disconnected" ? "disconnected" : "connected",
      name: a.name ?? a.displayName,
      phone: a.phone ?? a.phoneNumber,
    }))
  }

  async createProfile(name: string): Promise<any> {
    return this.request("POST", "/v1/profiles", { name })
  }

  async getOrCreateProfile(): Promise<{ id: string; name: string }> {
    const profiles = await this.getProfiles()
    if (profiles.length > 0) {
      return profiles[0]
    }
    const created = await this.createProfile("WaBooking")
    return { id: created._id ?? created.id, name: "WaBooking" }
  }

  async getConnectUrl(
    platform: string,
    profileId: string,
    redirectUrl?: string,
    state?: string,
    headless?: boolean
  ): Promise<string> {
    const params = new URLSearchParams({ profileId })
    if (redirectUrl) params.set("redirect_url", redirectUrl)
    if (state) params.set("state", state)
    if (headless) params.set("headless", "true")

    const data = await this.request("GET", `/v1/connect/${platform}?${params}`)
    return data.authUrl ?? data.url ?? data.auth_url
  }

  async exchangeOAuthCode(
    platform: string,
    code: string,
    state: string,
    profileId: string
  ): Promise<any> {
    return this.request("POST", `/v1/connect/${platform}`, {
      code,
      state,
      profileId,
    })
  }

  async validateApiKey(): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      const user = await this.getUser()
      if (!user) return { valid: false, error: "Tidak dapat memvalidasi API key" }
      return { valid: true }
    } catch (err: any) {
      return { valid: false, error: err.message }
    }
  }

  async checkConnection(): Promise<{
    connected: boolean
    waNumber?: string
    error?: string
  }> {
    try {
      const user = await this.getUser()
      if (!user) throw new Error("API key tidak valid")

      const accounts = await this.getAccounts()
      const wa = accounts.find(
        (a) => a.platform === "whatsapp" || a.platform === "wa"
      )

      if (wa) {
        return {
          connected: wa.status === "connected",
          waNumber: wa.phone || wa.username || undefined,
        }
      }

      return {
        connected: false,
        waNumber: undefined,
      }
    } catch (err: any) {
      return {
        connected: false,
        error: err.message,
      }
    }
  }

  async sendText(to: string, message: string): Promise<boolean> {
    const accounts = await this.getAccounts()
    const wa = accounts.find((a) => a.platform === "whatsapp")
    if (!wa) throw new Error("Tidak ada akun WhatsApp terhubung")

    await this.request("POST", "/v1/inbox/conversations", {
      accountId: wa.id,
      participantId: to,
      message,
    })
    return true
  }

  async sendInboxMessage(
    conversationId: string,
    accountId: string,
    text: string
  ): Promise<boolean> {
    await this.request("POST", `/v1/inbox/conversations/${conversationId}/messages`, {
      accountId,
      message: text,
    })
    return true
  }

  async sendInteractive(
    conversationId: string,
    accountId: string,
    interactive: Record<string, unknown>
  ): Promise<boolean> {
    await this.request("POST", `/v1/inbox/conversations/${conversationId}/messages`, {
      accountId,
      interactive,
    })
    return true
  }

  async sendButtons(
    conversationId: string,
    accountId: string,
    text: string,
    buttons: { id: string; title: string }[]
  ): Promise<boolean> {
    await this.request("POST", `/v1/inbox/conversations/${conversationId}/messages`, {
      accountId,
      message: text,
      buttons: buttons.map((b) => ({ id: b.id, title: b.title })),
    })
    return true
  }

  async sendTemplate(
    accountId: string,
    to: string,
    templateName: string,
    language: string,
    variables: Record<string, string>
  ): Promise<boolean> {
    await this.request("POST", "/v1/inbox/conversations", {
      accountId,
      to,
      template: {
        name: templateName,
        language,
        components: [
          {
            type: "body",
            parameters: Object.entries(variables).map(([key, val]) => ({
              type: "text",
              text: val,
            })),
          },
        ],
      },
    })
    return true
  }

  async disconnectAccount(accountId: string): Promise<void> {
    await this.request("DELETE", `/v1/accounts/${accountId}`)
  }

  async listContacts(platform: string = "whatsapp", limit: number = 200): Promise<{
    id: string; name: string; avatarUrl: string | null; platformIdentifier: string; displayIdentifier: string
  }[]> {
    try {
      const data = await this.request("GET", `/v1/contacts?platform=${platform}&limit=${limit}`)
      const list = data.contacts ?? data?.data ?? []
      return (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c._id ?? c.id,
        name: c.name || c.displayIdentifier || "",
        avatarUrl: c.avatarUrl || null,
        platformIdentifier: c.platformIdentifier || "",
        displayIdentifier: c.displayIdentifier || "",
      }))
    } catch {
      return []
    }
  }

  async registerWebhook(url: string, events: string[] = ["message.received"]): Promise<{ id: string } | null> {
    try {
      const data = await this.request("POST", "/v1/webhooks/settings", {
        name: "WaBooking",
        url,
        events,
        isActive: true,
      })
      const wh = data.webhook ?? data
      return { id: wh._id ?? wh.id }
    } catch {
      return null
    }
  }

  async listWebhooks(): Promise<{ _id: string; url: string; events: string[] }[]> {
    const data = await this.request("GET", "/v1/webhooks/settings")
    const list = data.webhooks ?? data ?? []
    return (Array.isArray(list) ? list : []).map((w: any) => ({
      _id: w._id ?? w.id,
      url: w.url,
      events: w.events,
    }))
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await this.request("DELETE", "/v1/webhooks/settings", { _id: webhookId })
      return true
    } catch {
      return false
    }
  }

  // ── WhatsApp Flows ──────────────────────────────────────────────

  async createFlow(accountId: string, name: string, categories: string[]): Promise<{ flowId: string } | { error: string }> {
    try {
      const data = await this.request("POST", "/v1/whatsapp/flows", { accountId, name, categories })
      return { flowId: data.flow?.id ?? data.id }
    } catch (err: any) {
      console.error("[ZERNIO] createFlow error:", err.message)
      return { error: err.message }
    }
  }

  async uploadFlowJson(flowId: string, accountId: string, flowJson: Record<string, unknown>): Promise<true | { error: string }> {
    try {
      const data = await this.request("PUT", `/v1/whatsapp/flows/${flowId}/json`, { accountId, flow_json: flowJson })
      if (data.validation_errors?.length > 0) {
        const msgs = data.validation_errors.map((ve: any) => ve.message).join("; ")
        console.error("[ZERNIO] uploadFlowJson validation errors:", msgs)
        return { error: `Validation errors: ${msgs}` }
      }
      return true
    } catch (err: any) {
      console.error("[ZERNIO] uploadFlowJson error:", err.message)
      return { error: err.message }
    }
  }

  async publishFlow(flowId: string, accountId: string): Promise<true | { error: string }> {
    try {
      const data = await this.request("POST", `/v1/whatsapp/flows/${flowId}/publish`, { accountId })
      return true
    } catch (err: any) {
      console.error("[ZERNIO] publishFlow error:", err.message)
      return { error: err.message }
    }
  }

  async sendFlowMessage(params: {
    accountId: string
    to: string
    flow_id: string
    flow_cta: string
    body: string
    header?: { type: string; text: string }
    footer?: string
    flow_action?: "navigate" | "data_exchange"
    flow_token?: string
    flow_action_payload?: Record<string, unknown>
  }): Promise<{ messageId?: string } | { error: string }> {
    try {
      const data = await this.request("POST", "/v1/whatsapp/flows/send", params)
      return { messageId: data.messageId }
    } catch (err: any) {
      console.error("[ZERNIO] sendFlowMessage error:", err.message)
      return { error: err.message }
    }
  }

  async deleteFlow(flowId: string, accountId: string): Promise<true | { error: string }> {
    try {
      await this.request("DELETE", `/v1/whatsapp/flows/${flowId}`, { accountId })
      return true
    } catch (err: any) {
      console.error("[ZERNIO] deleteFlow error:", err.message)
      return { error: err.message }
    }
  }

  async listFlowResponses(accountId: string, flowId: string): Promise<{ from: string; receivedAt: string; data: Record<string, unknown> }[]> {
    try {
      const data = await this.request("GET", `/v1/whatsapp/flow-responses?accountId=${accountId}&flowId=${flowId}`)
      return data.responses ?? []
    } catch (err: any) {
      console.error("[ZERNIO] listFlowResponses error:", err.message)
      return []
    }
  }
}
