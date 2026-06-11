# Design System: Chinh phục Núi Bà Đen (Admin Dashboard)

## 1. Visual Theme & Atmosphere
A clean, authoritative, high-density data dashboard designed for desktop screens. The interface prioritizes readability, precision, and efficient management of chatbot logs, feedback, places, and itinerary configurations. Layouts are grid-driven and balanced (Density: 7, Variance: 4, Motion: 5), utilizing crisp lines and clear data borders to delineate structural hierarchy.

## 2. Color Palette & Roles
- **Primary Navy** (#0b2545) — Primary sidebar background, solid brand highlights
- **Secondary Blue** (#134074) — Secondary headers, active text indicators
- **Accent Gold** (#d4af37) — Primary accent for active buttons, focus borders, active indicators, and specific status metrics
- **Accent Gold Hover** (#b8972f) — Active press/hover state of Gold buttons
- **Slate Background** (#f8fafc) — Default workspace body canvas background
- **Cream White** (#ffffff) — Panel backgrounds, data rows, topbar background, input fills
- **Dark Text** (#1e293b) — Primary text color for body copy, titles, and data values
- **Light Text** (#64748b) — Secondary text color for table headers, descriptions, and empty states
- **Border Slate** (#e2e8f0) — Divider lines, table cell boundaries, inactive borders
- **Success Green** (#10b981) — Verified status badges, high RAG confidence scores
- **Warning Yellow** (#f59e0b) — Pending badges, moderate RAG scores
- **Danger Red** (#ef4444) — Flagged issues, delete buttons, low RAG scores

## 3. Typography Rules
- **Display/Headings:** Be Vietnam Pro — Heavy font weights (700 or 800) for Sidebar branding, Page Titles, and Panel Titles. Sentence case is preferred.
- **Body & Controls:** Noto Sans — Normal weight (400) for descriptions, forms, and table rows; Semibold (600) for table headers, active links, and buttons.
- **Tabular Data:** Tabular Numbers & Monospace — Enable tabular figures (`font-variant-numeric: tabular-nums`) or use a monospaced font family for all numeric columns, timestamps, token counts, and RAG score values. This keeps numerical data aligned vertically and scannable.
- **Banned:** Emojis as icons, low-contrast text combinations, and default browser fonts.

## 4. Component Stylings
* **Buttons:**
  - `Primary:` Primary Navy background with Accent Gold border. Interactive state: hover shifts background to Secondary Blue; active click shrinks scale (`transform: scale(0.97)`).
  - `Secondary:` Cream White background with Slate Border. Interactive state: hover shifts to light slate.
  - `Danger:` Red background. Hover darkens, active clicks apply a subtle shrink.
* **Panels/Cards:** Crisp borders (`1px solid var(--border-slate)`), rounded corners (16px / 1rem), and soft navy-tinted shadows to prevent flat flatness.
* **Tables:** Alternating hover row states (`background-color: #f8fafc`). Header text in uppercase bold (`12px`, letter-spacing `0.5px`).
* **Forms:** Inputs must use standard labels above, outline focus borders in Accent Gold, and a 3px gold halo shadow (`rgba(212, 175, 55, 0.15)`).

## 5. Layout Principles
- Desktop-first layout with fixed left sidebar (width `260px` with a 3px right border in Accent Gold).
- Responsive breakpoint at `768px` which collapses the sidebar into a sliding off-canvas drawer (`transform: translateX(-100%)`) with a blurred background overlay.
- Layout sections containment using a max-width wrapper or grid container.

## 6. Motion & Interaction
- Smooth hover and focus transitions (200ms ease-out) applied globally on links, buttons, table rows, and form fields.
- Visual micro-feedback scales: buttons scale to `0.97` on active click; sidebar elements scale to `1.03` on active/active-hover hover.

## 7. Anti-Patterns (Banned)
- ❌ No emojis in table rows or buttons (use SVG icons exclusively).
- ❌ No purple/indigo background gradients.
- ❌ No layout-shifting transforms on hover.
- ❌ No low contrast white-on-gold text.
- ❌ No mathematical centering that looks optically wrong (e.g. icons next to text).
