import { AppChrome } from "@/components/app/app-chrome"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppChrome>{children}</AppChrome>
}
