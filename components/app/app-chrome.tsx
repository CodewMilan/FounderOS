"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const PRIMARY_NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/competitors", label: "Competitors" },
  { href: "/app/prospects", label: "Prospects" },
  { href: "/app/funding", label: "Funding" },
] as const

const MORE_NAV = [
  { href: "/app/workflows", label: "Workflows" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/settings", label: "Settings" },
] as const

function navLinkClass(pathname: string, href: string) {
  const active =
    href === "/app"
      ? pathname === "/app"
      : pathname === href || pathname.startsWith(`${href}/`)
  return cn(
    "flex flex-col justify-center text-xs md:text-[13px] font-medium leading-[14px] font-sans whitespace-nowrap shrink-0 transition-colors",
    active ? "text-[#37322F]" : "text-[rgba(49,45,43,0.80)] hover:text-[#37322F]",
  )
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const moreActive = MORE_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )

  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0" />
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0" />

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10 w-full">
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]" />

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center gap-2 relative z-30">
                <div className="flex justify-center items-center min-w-0 flex-1">
                  <div className="flex justify-start items-center shrink-0">
                    <Link
                      href="/"
                      className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans"
                    >
                      FounderOS
                    </Link>
                  </div>
                  <div className="pl-2 sm:pl-3 md:pl-5 lg:pl-5 flex justify-start items-center hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap">
                    {PRIMARY_NAV.map((item) => (
                      <Link key={item.href} href={item.href} className={navLinkClass(pathname, item.href)}>
                        {item.label}
                      </Link>
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          "flex items-center gap-0.5 outline-none shrink-0 text-xs md:text-[13px] font-medium leading-[14px] font-sans",
                          moreActive
                            ? "text-[#37322F]"
                            : "text-[rgba(49,45,43,0.80)] hover:text-[#37322F]",
                        )}
                      >
                        More
                        <ChevronDown className="size-3 opacity-70" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="border-[rgba(55,50,47,0.12)] bg-[#F7F5F3] text-[#37322F]"
                      >
                        {MORE_NAV.map((item) => (
                          <DropdownMenuItem key={item.href} asChild className="focus:bg-[rgba(55,50,47,0.06)]">
                            <Link href={item.href}>{item.label}</Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3 shrink-0">
                  <Link
                    href="/"
                    className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center"
                  >
                    <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                      Home
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col px-2 sm:px-4 md:px-8 lg:px-0 pt-20 sm:pt-24 md:pt-28 lg:pt-[108px] pb-12 md:pb-16">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
