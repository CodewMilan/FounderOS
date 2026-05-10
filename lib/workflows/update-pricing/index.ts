import { getVariantPrice, updateVariantPrice } from "@/lib/services/lemonSqueezyService"
import type { UpdatePricingRequest, UpdatePricingResult } from "@/lib/schemas/workflows"

/**
 * Pricing update workflow — approval-gated.
 *
 * When approved is false (or missing), returns a preview only.
 * The actual Lemon Squeezy PATCH is NEVER sent without explicit approval.
 */
export async function runUpdatePricingWorkflow(
  request: UpdatePricingRequest
): Promise<UpdatePricingResult> {
  const { newPriceCents, reason, approved } = request
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID ?? "preview-variant"

  // Always fetch current price for preview
  const { currentPriceCents } = await getVariantPrice(variantId)

  if (!approved) {
    return {
      variantId,
      oldPriceCents: currentPriceCents,
      newPriceCents,
      applied: false,
      previewOnly: true,
      reason,
    }
  }

  // Only reaches here when approved === true
  const updateResult = await updateVariantPrice(variantId, newPriceCents)

  return {
    variantId: updateResult.variantId,
    oldPriceCents: updateResult.oldPriceCents,
    newPriceCents: updateResult.newPriceCents,
    applied: updateResult.applied,
    previewOnly: updateResult.previewOnly,
    reason,
  }
}
