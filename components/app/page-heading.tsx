import { cn } from "@/lib/utils"

interface PageHeadingProps {
  children: React.ReactNode
  className?: string
}

/**
 * Primary page heading for /app screens.
 * Typography matches the CTA section hero heading
 * ("Ready to work with structured intelligence?" in components/cta-section.tsx).
 * Layout/alignment classes from that centred marketing context are intentionally omitted.
 */
export function PageHeading({ children, className }: PageHeadingProps) {
  return (
    <h1
      className={cn(
        "text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[56px] font-sans tracking-tight",
        className
      )}
    >
      {children}
    </h1>
  )
}
