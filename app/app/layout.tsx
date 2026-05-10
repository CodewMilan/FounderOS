import { GeistSans } from "geist/font/sans"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Separator } from "@/components/ui/separator"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={GeistSans.className}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[rgba(55,50,47,0.12)] px-6">
            <SidebarTrigger className="-ml-1 text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.06)]" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-[rgba(55,50,47,0.12)]"
            />
            <span className="text-sm font-medium text-[#605A57]">FounderOS</span>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
