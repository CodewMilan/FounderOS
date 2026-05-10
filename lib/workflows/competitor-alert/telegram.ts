// ─── sendTelegramMessage ──────────────────────────────────────────────────────

interface TelegramSendResult {
  sent: boolean
  error?: string
}

/**
 * Sends a message to Telegram via the Bot API.
 *
 * Uses MarkdownV2 parse mode.
 * Retries once on failure.
 * Returns { sent: false } without throwing if credentials are missing.
 */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn(
      "[competitor-alert/telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping send"
    )
    return { sent: false, error: "Telegram credentials not configured" }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  }

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

    if (res.ok) {
      return { sent: true }
    }

    const body = await res.text()
    const message = `Telegram API error: HTTP ${res.status} — ${body.slice(0, 200)}`

    if (attemptsLeft > 1) {
      console.warn(`[competitor-alert/telegram] Send failed, retrying… (${message})`)
      await new Promise<void>((r) => setTimeout(r, 1_000))
      return attemptSend(url, payload, attemptsLeft - 1)
    }

    console.error(`[competitor-alert/telegram] Send failed after retry: ${message}`)
    return { sent: false, error: message }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (attemptsLeft > 1) {
      console.warn(`[competitor-alert/telegram] Network error, retrying… (${message})`)
      await new Promise<void>((r) => setTimeout(r, 1_000))
      return attemptSend(url, payload, attemptsLeft - 1)
    }

    console.error(`[competitor-alert/telegram] Network error after retry: ${message}`)
    return { sent: false, error: message }
  }
}
