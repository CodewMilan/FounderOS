import { ProspectFeed } from "@/components/app/prospect-feed"
import { seedProspects } from "@/lib/seed"

export default function ProspectsPage() {
  return <ProspectFeed initialProspects={seedProspects} />
}
