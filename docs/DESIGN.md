# Design system — Souq

The store is a calm, editorial, bilingual (English / Arabic) shop. It should feel like a well-made
local boutique, not a template: warm paper background, ink-dark text, one deep-green brand color,
saffron used sparingly for ratings and highlights, generous whitespace, product photos doing the work.

## Rules every component must follow

1. **Colors: semantic tokens only.** Use `bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`,
   `text-subtle`, `border-line`, `border-line-strong`, `bg-brand`, `text-brand`, `bg-brand-soft`,
   `text-brand-fg`, `bg-accent`, `bg-accent-soft`, `text-success`/`bg-success-soft`, `warning`, `danger`.
   Never use raw palette classes (`bg-white`, `text-gray-*`, `bg-indigo-*`, `bg-slate-*`, hex values) and
   never add `dark:` variants for colors: the tokens already switch in dark mode (see `src/app/globals.css`).
2. **RTL: logical properties only.** `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`,
   `rounded-s-*`/`rounded-e-*`, `border-s`/`border-e`. Never `ml/mr/pl/pr/left/right/text-left/text-right`.
   Directional icons (arrows, chevrons, "back") must flip in RTL: add `rtl:-scale-x-100`.
3. **Primitives first.** Use `@/components/ui` — `Button`/`buttonClass` (variants: primary, secondary, outline,
   ghost, danger; sizes: sm, md, lg, icon), `Input`, `Textarea`, `Select`, `Field`, `Card`, `Badge`, `EmptyState`.
   Use `cn()` from `@/lib/cn`. Format money with `formatPrice(amount, locale)` and dates with
   `formatDate(date, locale)` from `@/lib/format` (get `locale` via `useLocale()` from next-intl).
4. **Every visible string is translated** via next-intl in both `messages/en.json` and `messages/ar.json`.
   No hardcoded English in JSX, no `alert()`/`confirm()` (use inline messages or a small dialog).
5. **Shape and depth.** Cards: `Card` (radius `--radius-card` = 16px, 1px `border-line`, soft `shadow-[var(--shadow-card)]`).
   Controls: radius `--radius-control` = 12px, height 44px (h-11) so touch targets are comfortable.
   Popovers/menus/drawers: `bg-surface border border-line shadow-[var(--shadow-pop)] rounded-[var(--radius-card)]`.
6. **Type.** Manrope (Latin) + IBM Plex Sans Arabic are loaded in the layout; just use `font-sans` (default).
   Page title `text-2xl sm:text-3xl font-bold tracking-tight`; section title `text-lg font-semibold`;
   body `text-sm`/`text-base`; secondary `text-muted`. Prices `font-bold tabular`.
7. **Layout.** Page container `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`, vertical rhythm `py-8 sm:py-10`.
   Must work at 360px wide with no horizontal scroll. Test mobile first.
8. **States.** Every async view has a loading skeleton (`bg-surface-2 animate-pulse`), an empty state
   (`EmptyState`), and an error state. Buttons that submit show `loading`. Focus is visible (global ring).
9. **Motion.** Short and quiet: `transition-colors`/`transition-transform duration-200`. Product image hover:
   `group-hover:scale-[1.03]`. Nothing bouncy. Reduced motion is respected globally.
10. **Icons.** Inline SVG, 20px (`h-5 w-5`), `stroke-width 1.75`, `currentColor`. Icon-only buttons need `aria-label`.
