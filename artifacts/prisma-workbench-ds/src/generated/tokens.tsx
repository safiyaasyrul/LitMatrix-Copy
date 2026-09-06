/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f8fafc",
      "foreground": "#0f172a",
      "border": "#e2e8f0",
      "card": "#ffffff",
      "cardForeground": "#0f172a",
      "popover": "#ffffff",
      "popoverForeground": "#0f172a",
      "primary": "#4f46e5",
      "primaryForeground": "#ffffff",
      "secondary": "#eef2ff",
      "secondaryForeground": "#3730a3",
      "muted": "#f1f5f9",
      "mutedForeground": "#64748b",
      "accent": "#eff6ff",
      "accentForeground": "#1e40af",
      "destructive": "#e11d48",
      "destructiveForeground": "#ffffff",
      "input": "#cbd5e1",
      "ring": "#6366f1",
      "chart1": "#4f46e5",
      "chart2": "#059669",
      "chart3": "#d97706",
      "chart4": "#e11d48",
      "chart5": "#0284c7",
      "sidebar": "#ffffff",
      "sidebarForeground": "#475569",
      "sidebarBorder": "#e2e8f0",
      "sidebarPrimary": "#4f46e5",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#eef2ff",
      "sidebarAccentForeground": "#312e81",
      "sidebarRing": "#6366f1"
    },
    "dark": {
      "background": "#0f172a",
      "foreground": "#f8fafc",
      "border": "#334155",
      "card": "#111827",
      "cardForeground": "#f8fafc",
      "popover": "#111827",
      "popoverForeground": "#f8fafc",
      "primary": "#818cf8",
      "primaryForeground": "#1e1b4b",
      "secondary": "#1e293b",
      "secondaryForeground": "#e0e7ff",
      "muted": "#1e293b",
      "mutedForeground": "#94a3b8",
      "accent": "#172554",
      "accentForeground": "#dbeafe",
      "destructive": "#be123c",
      "destructiveForeground": "#fff1f2",
      "input": "#475569",
      "ring": "#a5b4fc",
      "chart1": "#818cf8",
      "chart2": "#34d399",
      "chart3": "#fbbf24",
      "chart4": "#fb7185",
      "chart5": "#38bdf8",
      "sidebar": "#111827",
      "sidebarForeground": "#cbd5e1",
      "sidebarBorder": "#334155",
      "sidebarPrimary": "#818cf8",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#1e293b",
      "sidebarAccentForeground": "#e0e7ff",
      "sidebarRing": "#a5b4fc"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "ui-sans-serif",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "Menlo",
      "ui-monospace",
      "monospace"
    ]
  },
  "radius": "0.5rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
