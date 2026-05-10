/**
 * Dashboard visual primitives — compact, on-brand, no external chart library.
 *
 * Color usage is intentionally restrained:
 * - Most elements use neutrals from the existing theme palette
 * - Amber is reserved for genuine urgency (high-priority actions, ≤30d deadlines)
 * - Red/green are not used — visual hierarchy comes from layout and emphasis
 */

import { cn } from "@/lib/utils"

// ─── MiniSparkline ────────────────────────────────────────────────────────────

interface MiniSparklineProps {
  /** Array of numeric values, oldest first. Needs ≥ 2 values. */
  data: number[]
  className?: string
}

/**
 * Tiny SVG area sparkline. Uses currentColor so it inherits the parent's
 * text color — defaults to the muted neutral already used on cards.
 */
export function MiniSparkline({ data, className }: MiniSparklineProps) {
  if (data.length < 2) return null

  const W = 56
  const H = 20
  const padX = 1
  const padY = 2
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const max = Math.max(...data, 1)

  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * innerW
    const y = padY + (1 - v / max) * innerH
    return [x, y] as [number, number]
  })

  const line = pts.map(([x, y]) => `${x},${y}`).join(" ")
  const area = [
    `${pts[0][0]},${H}`,
    ...pts.map(([x, y]) => `${x},${y}`),
    `${pts[pts.length - 1][0]},${H}`,
  ].join(" ")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: W, height: H }}
      className={cn("overflow-visible shrink-0", className)}
      aria-hidden="true"
    >
      <polygon points={area} fill="currentColor" opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.35}
      />
    </svg>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  /** Score 0–100 */
  score: number
  className?: string
}

/**
 * Horizontal score/progress bar. Matches existing fit-bar pattern in codebase.
 */
export function ScoreBar({ score, className }: ScoreBarProps) {
  return (
    <div className={cn("h-1 w-full rounded-full bg-[rgba(55,50,47,0.08)]", className)}>
      <div
        className="h-1 rounded-full bg-[#37322F] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  )
}

// ─── SignalStrengthBar ────────────────────────────────────────────────────────

interface SignalStrengthBarProps {
  /** Score 0–100. Maps onto 5 filled segments. */
  score: number
  className?: string
}

/**
 * Five-segment bar showing signal strength.
 * All segments use the same neutral color — filled segments are more opaque.
 * Avoids decorative color encoding; significance level is shown as density.
 */
export function SignalStrengthBar({ score, className }: SignalStrengthBarProps) {
  const filled = Math.round((score / 100) * 5)

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Signal strength ${score}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-2 w-1.5 rounded-sm",
            i < filled ? "bg-[rgba(55,50,47,0.35)]" : "bg-[rgba(55,50,47,0.08)]"
          )}
        />
      ))}
    </div>
  )
}

// ─── DeltaPill ────────────────────────────────────────────────────────────────

interface DeltaPillProps {
  /** Positive = increase, negative = decrease. */
  delta: number
  suffix?: string
  className?: string
}

/**
 * Small trend indicator. Neutral styling — trend direction is conveyed by the
 * arrow symbol, not by color. Keeps the card palette calm.
 */
export function DeltaPill({ delta, suffix = "this wk", className }: DeltaPillProps) {
  if (delta === 0) return null
  const isUp = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        "bg-[rgba(55,50,47,0.04)] border-[rgba(55,50,47,0.12)] text-[#605A57]",
        className
      )}
    >
      {isUp ? "↑" : "↓"} {Math.abs(delta)} {suffix}
    </span>
  )
}

// ─── UrgencyPill ──────────────────────────────────────────────────────────────

type Urgency = "high" | "medium" | "low"

interface UrgencyPillProps {
  urgency: Urgency
  className?: string
}

/**
 * Compact urgency pill. Only "high" urgency gets a semantic amber treatment;
 * medium and low use neutral styling to avoid visual noise.
 */
export function UrgencyPill({ urgency, className }: UrgencyPillProps) {
  const styles =
    urgency === "high"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-[rgba(55,50,47,0.04)] text-[#605A57] border-[rgba(55,50,47,0.12)]"

  const label = urgency === "high" ? "High" : urgency === "medium" ? "Med" : "Low"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        styles,
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── DeadlinePill ─────────────────────────────────────────────────────────────

interface DeadlinePillProps {
  /** Days remaining until deadline. */
  days: number
  className?: string
}

/**
 * Deadline-remaining pill. Only deadlines ≤ 30 days get amber treatment
 * (genuine urgency). Everything else is neutral to avoid visual noise.
 */
export function DeadlinePill({ days, className }: DeadlinePillProps) {
  const isUrgent = days <= 30

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        isUrgent
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-[rgba(55,50,47,0.04)] text-[#605A57] border-[rgba(55,50,47,0.12)]",
        className
      )}
    >
      {days}d left
    </span>
  )
}
