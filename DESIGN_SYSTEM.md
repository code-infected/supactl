# Supactl Design System: "Digital Obsidian"

This document outlines the core design language and tokens for Supactl. Every design decision must follow these principles to maintain the "Native-Plus" premium engineering tool aesthetic.

## 1. Creative North Star

The design system is built to transform a database utility into a high-end editorial experience. The "Creative North Star" is **The Digital Obsidian**: a philosophy of deep, monochromatic layering that feels carved from a single block of dark glass.

We embrace **Tonal Architecture**. Instead of relying on solid lines to define where a sidebar ends and a table begins, we use subtle shifts in light and depth. 

## 2. Color Palette & Tonal Hierarchy

We operate in a restricted, high-contrast spectrum. The palette is rooted in a "Deep Dark" spectrum.

| Token | Hex Value | Role |
| :--- | :--- | :--- |
| `background` | `#0e0e0e` | The base "void." Use for the main application backdrop / sidebar. |
| `surface-low` | `#131313` | Secondary workspace or utility panels. |
| `surface` | `#1a1919` | Main content areas / Code editor background. |
| `surface-high` | `#201f1f` | Hover states and active navigation items. |
| `surface-highest` | `#262626` | Floating modals / Popovers. |
| `primary` | `#3ECF8E` | Supabase Green - use sparingly for high-impact actions. |
| `primary-container`| `#14b778` | Brighter interactions. |
| `error` | `#ff716c` | Destructive/Warning. Desaturated to maintain the dark aesthetic. |
| `text-muted` | `#adaaaa` | De-emphasized UI text. |
| `text-dimmer` | `#5c5b5b` | Extremely muted metadata (timestamps, table dimensions). |

### The "No-Line" Rule
Explicitly prohibit `1px` solid borders for sectioning panels. Boundaries must be defined solely through background color shifts. If a line is absolutely needed, use `rgba(255,255,255,0.05)`.

### Signature Element — "Glass & Glow"
Main CTAs (Primary Buttons) and connection indicators use a custom inner or outer glow to give a tactile, "lit-from-within" appearance.
```css
box-shadow: 0 0 8px rgba(62, 207, 142, 0.4);
```

## 3. Typography: Geist Sans & Mono

The system pairs the precision of **Geist Mono** with the clarity of **Geist Sans**.

- **Editorial Headlines (Geist Sans):** Use for high-level module names. Large, thin, and high-contrast against the dark background.
- **Body UI (Geist Sans):** Standard application text.
- **Data & Code (Geist Mono):** Every piece of user-generated data, table outputs, UUIDs, or system output must use Geist Mono. This differentiates "system UI" from "user data," creating a clear cognitive model.
- **Micro-Copy:** `text-[10px]` with `tracking-widest` should be used for section labels to maintain high density without clutter.

## 4. Components

### Navigation Shell
- **Widths:** Fixed Left Sidebar (220px). Fluid for the main editor.
- **TopNav:** Custom draggable region across the top, housing context-aware OS window controls.

### Cards & Lists
- **The Divider Rule:** Forbid the use of horizontal divider lines inside data grids. Use tight vertical padding or alternating background shifts (`background` mixed with `white/5`).
- **Rounded Corners:** Max 4px (`rounded-md` in Tailwind) for inputs and inner panels. The outer shell uses 8px.

### Inputs & Fields
- **Container:** `bg-surface-low` (#131313).
- **Radius:** Fixed at `4px` (`rounded`) for a sharp, professional edge.
- **Focus State:** No heavy rings. Use a 1px primary border and a subtle primary outer glow.

## 5. Do's and Don'ts

### Do
- **Use Asymmetry:** In a 3-column layout, keep the right panel (200-300px) restricted for contextual metadata only.
- **Embrace Density:** Tools demand higher density than consumer websites. Users expect more information on the screen.
- **Tonal Laying:** Achieve lift by stacking surface colors (Low -> High), rather than drop shadows. 

### Don't
- **Don't use decorative gradients** (aside from glows). Backgrounds must remain flat and tonal.
- **Don't use 100% white (#FFFFFF) for body text.** Use `text-muted` to reduce eye strain in this dark environment. Reserve pure white for headings.
- **Don't break the column widths** for sidebars and panels. Keep the application shell feeling stable and reliable.
