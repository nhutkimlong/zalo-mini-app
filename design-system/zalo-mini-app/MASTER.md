# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Zalo Mini App - Chinh phục Núi Bà Đen
**Generated:** 2026-06-08 16:10:00
**Category:** Travel/Tourism (Spiritual & Heritage Tourism)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary Navy | `#0b2545` | `--primary-navy` |
| Secondary Blue | `#134074` | `--secondary-blue` |
| Accent Gold | `#d4af37` | `--accent-gold` |
| Accent Gold Dark | `#b8972f` | `--accent-gold-dark` |
| Light Background | `#f4f7f6` | `--light-bg` |
| Cream White | `#ffffff` | `--cream-white` |
| Dark Text | `#1d2d44` | `--dark-text` |
| Light Text | `#606f7b` | `--light-text` |

**Color Notes:** Premium Navy and Royal Gold accents representing the spiritual heritage of Ba Den Mountain.

### Typography

- **Heading Font:** Be Vietnam Pro
- **Body Font:** Noto Sans / Apple System
- **Mood:** spiritual, heritage, premium, readable, clean, multilingual, accessible
- **Google Fonts:** [Be Vietnam Pro + Noto Sans](https://fonts.google.com/share?selection.family=Be+Vietnam+Pro:wght@300;400;500;600;700|Noto+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0, 0, 0, 0.05)` | Subtle card hover / active state |
| `--shadow-md` | `0 4px 12px rgba(11, 37, 69, 0.08)` | Standard glass cards |
| `--shadow-lg` | `0 8px 24px rgba(11, 37, 69, 0.12)` | Active focus / modals |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--accent-gold);
  color: var(--primary-navy);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
  border: 1px solid var(--accent-gold);
}

.btn-primary:hover {
  background: var(--accent-gold-dark);
  border-color: var(--accent-gold-dark);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--accent-gold);
  border: 1.5px solid var(--accent-gold);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

---

## Style Guidelines

**Style Name:** Sacred Gold & Navy Asymmetric Narrative

- **Key Effects:** Smooth slide-up animations using custom spring cubic-bezier, glowing-pulses on interactive markers, subtle glass overlays over mountain backdrops.
- **Visual Geometry:** Soft but strong bento-styled container corners (16px) combined with sharp crisp lines (1.5px golden borders) to maintain high-end heritage feeling.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Purple or Indigo accents** — Strictly banned color theme (Purple Ban).
- ❌ **Emojis as icons** — Use SVG icons (Lucide/Heroicons) exclusively.
- ❌ **Layout-shifting hovers** — No scaling transforms that shift neighboring items.
- ❌ **Low contrast text** — White text on yellow, or light gray text on white background is forbidden.
- ❌ **Missing cursor:pointer** — Make sure all custom card and button links trigger cursor pointer.
- ❌ **Static/Lifeless interaction** — All buttons/cards must have touch active/hover feedback.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover/Active states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
