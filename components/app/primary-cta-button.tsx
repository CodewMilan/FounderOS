import Link from "next/link"

interface PrimaryCtaButtonProps {
  href: string
  children: React.ReactNode
}

/**
 * Primary CTA button for /app screens.
 * Matches the exact style of the "Open dashboard" button in components/cta-section.tsx
 * — same Link wrapper, inset shadow, gradient overlay, and label treatment.
 */
export function PrimaryCtaButton({ href, children }: PrimaryCtaButtonProps) {
  return (
    <Link
      href={href}
      className="h-10 px-12 py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#2A2520] transition-colors"
    >
      <div className="w-44 h-[41px] absolute left-0 top-0 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
      <div className="flex flex-col justify-center text-white text-[13px] font-medium leading-5 font-sans relative z-10">
        {children}
      </div>
    </Link>
  )
}
