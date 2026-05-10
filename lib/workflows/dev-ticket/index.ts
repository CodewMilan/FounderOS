import { sendDevTicket } from "@/lib/services/slackService"
import type { DevTicketRequest, DevTicketResult } from "@/lib/schemas/workflows"

export async function runDevTicketWorkflow(
  request: DevTicketRequest
): Promise<DevTicketResult> {
  const slackResult = await sendDevTicket(request)

  return {
    slackSent: slackResult.sent,
    slackError: slackResult.error,
  }
}
