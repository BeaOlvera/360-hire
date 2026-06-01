/**
 * Zephyron Hire wordmark logo.
 *
 * Pure typography, two weights: "Zephyron" 800, "Hire" 400, separated by a
 * thin vertical line. Monochrome — black/grey on light backgrounds, white/grey
 * on dark backgrounds. No symbol mark, intentionally editorial / sober.
 *
 * Usage:
 *   <Logo variant="dark" />              // black on light bg (default)
 *   <Logo variant="light" />             // white on dark bg
 *   <Logo height={20} />                 // override size
 */
type Variant = 'dark' | 'light'

type Props = {
  variant?: Variant
  height?: number
}

export default function Logo({ variant = 'dark', height = 24 }: Props) {
  const isDark = variant === 'dark'
  const main = isDark ? '#0A0A0A' : '#FFFFFF'
  const line = isDark ? '#AEABA3' : '#6B6B6B'
  const sub  = isDark ? '#6B6B6B' : '#AEABA3'
  return (
    <svg
      viewBox="0 0 200 50"
      height={height}
      style={{ display: 'block', height, width: 'auto' }}
      role="img"
      aria-label="Zephyron Hire"
    >
      <text x="0" y="34" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight="800" fontSize="26" letterSpacing="-0.6" fill={main}>Zephyron</text>
      <line x1="124" y1="11" x2="124" y2="39" stroke={line} strokeWidth="1" />
      <text x="132" y="34" fontFamily="-apple-system, Segoe UI, Roboto, sans-serif" fontWeight="400" fontSize="26" letterSpacing="-0.2" fill={sub}>Hire</text>
    </svg>
  )
}

/**
 * Same wordmark as an HTML string, for embedding in generated HTML
 * (email bodies, fit reports, comprehensive reports). Inline SVG so it
 * works without external assets.
 */
export function logoSvgHtml(variant: Variant = 'dark', height = 24): string {
  const isDark = variant === 'dark'
  const main = isDark ? '#0A0A0A' : '#FFFFFF'
  const line = isDark ? '#AEABA3' : '#6B6B6B'
  const sub  = isDark ? '#6B6B6B' : '#AEABA3'
  return `<svg viewBox="0 0 200 50" height="${height}" style="display:block;height:${height}px;width:auto" role="img" aria-label="Zephyron Hire">
    <text x="0" y="34" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="26" letter-spacing="-0.6" fill="${main}">Zephyron</text>
    <line x1="124" y1="11" x2="124" y2="39" stroke="${line}" stroke-width="1" />
    <text x="132" y="34" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="400" font-size="26" letter-spacing="-0.2" fill="${sub}">Hire</text>
  </svg>`
}
