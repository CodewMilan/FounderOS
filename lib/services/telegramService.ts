/**
 * telegramService
 *
 * Shared Telegram Bot API sender used by all workflows.
 * Retries once on failure. Returns { sent: false } gracefully
 * when credentials are missing — never throws.
 */

export interface TelegramSendResult {
  sent: boolean
  error?: string
}

/**
 * Send a Telegram message to the configured chat.
 * Parse mode: Markdown (supports *bold*, _italic_, `code`).
 */
export async function sendMessage(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn("[telegramService] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping")
    return { sent: false, error: "Telegram credentials not configured" }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const payload = { chat_id: chatId, text, parse_mode: "Markdown" }

  return attemptSend(url, payload, 2)
}

async function attemptSend(
  url: string,
  payload: Record<string, unknown>,
  attemptsLeft: number
): Promise<TelegramSendResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })

    if (res.ok) return { sent: true }

    const body = await res.text()
    const message = `Telegram API error: HTTP ${res.status} — ${body.slice(0, 200)}`

    if (attemptsLeft > 1) {
      console.warn(`[telegramService] Send failed, retrying… (${message})`)
      await new Promise<void>((r) => setTimeout(r, 1_000))
      return attemptSend(url, payload, attemptsLeft - 1)
    }

    console.error(`[telegramService] Send failed after retry: ${message}`)
    return { sent: false, error: message }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (attemptsLeft > 1) {
      console.warn(`[telegramService] Network error, retrying… (${message})`)
      await new Promise<void>((r) => setTimeout(r, 1_000))
      return attemptSend(url, payload, attemptsLeft - 1)
    }

    console.error(`[telegramService] Network error after retry: ${message}`)
    return { sent: false, error: message }
  }
}
