# Design System: Chinh phục Núi Bà Đen (Website)

## 1. Visual Theme & Atmosphere
A premium, culturally-attuned mobile interface representing the sacred spiritual heritage of Bà Đen Mountain. The atmosphere is a mixture of digital clarity and traditional elegance ("Sacred Gold & Navy Asymmetric Narrative"). Layouts are asymmetric and narrative-driven (Variance: 6, Density: 5, Motion: 6) with high whitespace usage, soft card corners, and tactile interaction feedback.

## 2. Color Palette & Roles
- **Primary Navy** (#0b2545) — Primary branding background, header background, and solid containers
- **Secondary Blue** (#134074) — Secondary surfaces, message bubbles, active states
- **Accent Gold** (#d4af37) — Primary accent for key actions, CTA buttons, active state highlights, borders, and icons
- **Accent Gold Dark** (#b8972f) — Active press/hover state of Gold CTAs
- **Light Background** (#f4f7f6) — Default page background in light mode
- **Cream White** (#ffffff) — Card text, icons, select component container background
- **Dark Text** (#1d2d44) — Default body/content text in light mode
- **Light Text** (#606f7b) — Secondary body descriptions, subtitle indicators
- **Glass BG** (rgba(255, 255, 255, 0.85)) — Transparent container background with backdrop blur
- **Glass Border** (rgba(197, 168, 128, 0.2)) — Transparent boundary line for glassmorphic elements

## 3. Typography Rules
- **Display/Headings:** Be Vietnam Pro — Tight letter-spacing (-0.02em), heavy font weight (700 or 800), sentence case. Used for Page Headers, Card Titles, and Main Banners.
- **Body Text:** Noto Sans — Normal letter-spacing (0em), relaxed line-height (1.6), weight 400 or 500. Maximum line width of 65 characters.
- **Banned:** Emojis as icons, low-contrast text combinations, pure black `#000000` text, and default system fonts on headers.

## 4. Component Stylings
* **Buttons:**
  - `Primary:` Accent Gold background, Primary Navy text. Tactile push feedback (`transform: scale(0.96) translateY(1px)`) on active state. Transition duration 200ms ease.
  - `Secondary:` Transparent background, Accent Gold border (1.5px), Accent Gold text.
* **Cards:** Generously rounded corners (16px / 1rem). Diffused tinted shadow reflecting the background hue (using Navy-tinted shadows instead of raw black). Glassmorphic overlay option for visual depth.
* **Inputs:** Light borders, focus outline in Accent Gold with 3px glow shadow (`rgba(212, 175, 55, 0.15)`). Prevent iOS auto-zoom by maintaining input font size at minimum `16px`.
* **Loaders:** Skeletal pulse shimmers matching content shape. Never use generic circular spinners.

## 5. Layout Principles
- Mobile-first flexbox layout with single-column responsive collapse on all child grids.
- Viewport containment utilizing `min-height: 100dvh` (with custom JS `--app-height` fallback) to prevent iOS toolbars and keyboards from causing page overflow.
- Generous padding blocks (`--space-lg` of 24px) to let layouts breathe.
- All interactive links, buttons, and custom cards must declare `cursor: pointer` explicitly.

## 6. Motion & Interaction
- Spring-physics motion curves (`cubic-bezier(0.4, 0, 0.2, 1)`) for UI animations.
- Hover-scale transitions of `scale(1.02)` and active tap-feedback of `scale(0.96)`.
- GPU-accelerated transitions utilizing only `transform` and `opacity` to avoid layout thrashing.

## 7. Anti-Patterns (Banned)
- ❌ No emojis in headings or button triggers.
- ❌ No purple or indigo gradient accents.
- ❌ No layout-shifting transforms.
- ❌ No raw black `#000000` backgrounds.
- ❌ No low contrast white-on-yellow or light gray-on-white text.
- ❌ No flat vectors without subtle shadows or gradients.
- ❌ No dead links linking to `#` (must disable or link to real paths).
- ❌ No bouncing chevrons or "Scroll to explore" filler text in hero sections.
