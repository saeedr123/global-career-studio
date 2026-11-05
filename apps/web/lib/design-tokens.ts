// Design tokens, Phase 2 increment 2.
// These tokens are the single source for colours, fonts, spacing, and radii
// in the web app shell. Components should use the Tailwind classes or the
// CSS variables below, not ad hoc hex values, so a later edition skin can
// change branding in one place. No token here is a price, limit, or offer.

export const designTokens = {
  colors: {
    navy: "#16294d",
    navyDark: "#0f1e3a",
    gold: "#d9a441",
    goldSoft: "#f5e9c8",
    ink: "#1f2937",
    muted: "#64748b",
    paper: "#ffffff",
    background: "#f8fafc",
    border: "#e2e8f0",
    success: "#15803d",
    warningBackground: "#fffbeb",
    warningBorder: "#f59e0b"
  },
  fonts: {
    sans: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    heading: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  },
  spacing: {
    pagePaddingMobile: "1rem",
    pagePaddingDesktop: "1.5rem",
    cardPadding: "1rem",
    sectionGap: "1.5rem",
    cardGap: "1rem"
  },
  // Type scale, Increment 16. One scale for the whole app, used by the
  // semantic classes in globals.css. Hero uses a fluid size so it fits
  // a phone screen without scrolling past a text block. No external
  // font is loaded; the system stack in fonts above stays.
  typography: {
    hero: "clamp(2rem, 6vw, 3rem)",
    pageTitle: "1.875rem",
    sectionTitle: "1.5rem",
    cardTitle: "1.125rem",
    body: "1rem",
    small: "0.875rem"
  },
  // Minimum tap target, Increment 16, dossier rule 14. Every button,
  // link in the header, and form input is at least this tall.
  tapTarget: "44px",
  // Motion, Increment 18. Subtle only: short ease-out transitions on
  // cards and buttons, and a gentle rise on entry. Transform and
  // opacity only, so it stays smooth on phones. All motion is off
  // under prefers-reduced-motion in globals.css.
  motion: {
    fast: "150ms",
    base: "180ms",
    rise: "500ms",
    ease: "ease-out",
    lift: "-2px",
    riseDistance: "8px"
  },
  radii: {
    card: "0.75rem",
    button: "0.5rem",
    pill: "9999px"
  },
  breakpoints: {
    phone: "up to 639px, single column",
    tablet: "640px to 1023px, two columns",
    desktop: "1024px and above, three columns"
  }
};
