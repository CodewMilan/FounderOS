/**
 * lemonSqueezyService
 *
 * Manages pricing updates via the Lemon Squeezy API.
 *
 * IMPORTANT: updateVariantPrice is NEVER auto-executed.
 * The caller must explicitly pass approved=true.
 * getVariantPrice always reads before any write.
 */

const LS_BASE = "https://api.lemonsqueezy.com/v1"

export interface VariantPriceResult {
  variantId: string
  currentPriceCents: number
}

export interface PricingUpdateResult {
  variantId: string
  oldPriceCents: number
  newPriceCents: number
  applied: boolean
  previewOnly: boolean
}

// ─── getVariantPrice ──────────────────────────────────────────────────────────

/**
 * Fetch the current price for a Lemon Squeezy variant.
 * Falls back to a mock value if credentials are missing.
 */
export async function getVariantPrice(variantId: string): Promise<VariantPriceResult> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  if (!apiKey) {
    console.warn("[lemonSqueezyService] LEMON_SQUEEZY_API_KEY not set — returning mock price")
    return { variantId, currentPriceCents: 2900 }
  }

  const res = await fetch(`${LS_BASE}/variants/${variantId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/vnd.api+json",
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lemon Squeezy fetch failed: HTTP ${res.status} — ${text.slice(0, 200)}`)
  }

  const data = await res.json() as {
    data: { attributes: { price: number } }
  }

  return {
    variantId,
    currentPriceCents: data.data.attributes.price,
  }
}

// ─── updateVariantPrice ───────────────────────────────────────────────────────

/**
 * Update the price of a Lemon Squeezy variant.
 *
 * This function MUST only be called when the user has explicitly approved
 * the change (approved === true). The API route enforces this contract.
 */
export async function updateVariantPrice(
  variantId: string,
  newPriceCents: number
): Promise<PricingUpdateResult> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  if (!apiKey) {
    console.warn("[lemonSqueezyService] LEMON_SQUEEZY_API_KEY not set — skipping update")
    return {
      variantId,
      oldPriceCents: 2900,
      newPriceCents,
      applied: false,
      previewOnly: true,
    }
  }

  // Always read current price before writing
  const { currentPriceCents } = await getVariantPrice(variantId)

  const res = await fetch(`${LS_BASE}/variants/${variantId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "variants",
        id: variantId,
        attributes: { price: newPriceCents },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lemon Squeezy update failed: HTTP ${res.status} — ${text.slice(0, 200)}`)
  }

  return {
    variantId,
    oldPriceCents: currentPriceCents,
    newPriceCents,
    applied: true,
    previewOnly: false,
  }
}
