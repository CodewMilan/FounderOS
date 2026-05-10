import { WorkflowPanel } from "@/components/app/workflow-panel"
import { PageHeading } from "@/components/app/page-heading"

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageHeading>Workflow Actions</PageHeading>
        <p className="text-sm text-[#605A57]">
          Trigger automated intelligence workflows. Each workflow scrapes a URL, analyzes it with
          AI, and delivers structured briefs to Telegram and Slack.
        </p>
      </div>
      <WorkflowPanel />
    </div>
  )
}
