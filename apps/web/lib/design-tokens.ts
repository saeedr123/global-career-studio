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
