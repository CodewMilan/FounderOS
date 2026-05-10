"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Radar,
  Users,
  Banknote,
  Settings,
  Zap,
  Workflow,
  User,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navItems = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/app/competitors",
    label: "Competitors",
    icon: Radar,
  },
  {
    href: "/app/prospects",
    label: "Prospects",
    icon: Users,
  },
  {
    href: "/app/funding",
    label: "Funding",
    icon: Banknote,
  },
  {
    href: "/app/workflows",
    label: "Workflows",
    icon: Workflow,
  },
  {
    href: "/app/profile",
    label: "Profile",
    icon: User,
  },
]

const secondaryItems = [
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#37322F] text-white">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[#37322F]">
                    FounderOS
                  </span>
                  <span className="truncate text-xs text-[#605A57]">
                    Founder Intelligence
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/app"
                        ? pathname === "/app"
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                    }
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
