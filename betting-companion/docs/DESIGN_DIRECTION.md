# Velvet Stakes - Design Direction

> A luxurious noir casino aesthetic with Art Deco influences for the betting companion PWA.

---

## Design Philosophy

**Core Concept:** High-stakes decisions in a smoke-filled private room.

The interface should feel like you're making consequential choices at an exclusive establishment. Every interaction carries weight. The design avoids generic "app" aesthetics in favor of something memorable and distinctive.

**Key Principles:**
- **Dramatic restraint** - Dark backgrounds let content breathe and glow
- **Tactile feedback** - Buttons feel like they have weight and consequence
- **Hierarchy through light** - Gold accents draw attention to what matters
- **Motion with purpose** - Animations reinforce the gravity of decisions

---

## Color Palette

### Core Noir Foundation
```css
--noir: #050508          /* True black, main background */
--noir-soft: #0c0c10     /* Slightly elevated surfaces */
--noir-elevated: #141418 /* Cards, input backgrounds */
--noir-card: #1a1a1f     /* Card surfaces */
--noir-border: #2a2a32   /* Subtle borders */
```

### Accent Colors
```css
--gold: #d4af37          /* Primary accent, champagne gold */
--gold-dim: #a68a2a      /* Muted gold for borders */
--gold-glow: rgba(212, 175, 55, 0.15)  /* Subtle gold backgrounds */
--champagne: #f5e6c8     /* Premium text color */
```

### State Colors
```css
/* Success / Wins */
--emerald: #10b981
--emerald-deep: #065f46
--emerald-glow: rgba(16, 185, 129, 0.12)

/* Danger / Losses */
--crimson: #dc2626
--crimson-deep: #7f1d1d
--crimson-glow: rgba(220, 38, 38, 0.12)

/* Warning / Recovery */
--amber: #f59e0b
--amber-deep: #78350f
--amber-glow: rgba(245, 158, 11, 0.12)
```

### Text Hierarchy
```css
--text-primary: #f5f5f5    /* Main content */
--text-secondary: #a1a1aa  /* Supporting text */
--text-muted: #6b6b73      /* Labels, hints */
```

---

## Typography

### Font Stack
```css
--font-display: "Cormorant Garamond", Georgia, serif;
--font-body: "DM Sans", system-ui, sans-serif;
```

**Cormorant Garamond** - Elegant serif for headlines, numbers, and stakes. Conveys luxury and tradition.

**DM Sans** - Clean geometric sans-serif for body text and UI elements. Modern but not cold.

### Usage Guidelines

| Context | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| Page titles | Cormorant | 500 | 2-2.5rem | 0.02em |
| Stake display | Cormorant | 600 | 4-5rem | -0.02em |
| Card titles | Cormorant | 600 | 1.25rem | 0.02em |
| Body text | DM Sans | 400 | 0.875rem | normal |
| Labels | DM Sans | 500 | 0.625rem | 0.15em |
| Buttons | DM Sans | 600 | varies | 0.05em |

---

## Component Patterns

### Cards

Three primary card variants:

```css
.card-noir     /* Default - dark with subtle gradient overlay */
.card-gold     /* Highlighted - gold border with glow */
.card-emerald  /* Success state - green gradient */
.card-crimson  /* Danger state - red gradient */
.card-amber    /* Warning state - amber gradient */
```

Cards include a subtle diagonal gradient overlay for depth:
```css
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.03) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.1) 100%
);
```

### Buttons

All buttons use the `.btn-stakes` base class with variants:

```css
.btn-gold   /* Primary action - gold gradient */
.btn-win    /* Success - emerald gradient */
.btn-loss   /* Danger - crimson gradient */
.btn-ghost  /* Secondary - transparent with border */
```

Button characteristics:
- Uppercase text with letter-spacing
- Gradient backgrounds with metallic sheen overlay
- Colored drop shadows that match the button
- Scale transform on active (0.97)
- Brightness increase on hover

### Decision Cards (Roguelike)

The signature component - three choices presented like game cards:

```css
.decision-card           /* Base with spring hover animation */
.decision-card.carry-over   /* Emerald theme */
.decision-card.write-off    /* Amber theme */
.decision-card.stop-session /* Crimson theme */
```

Features:
- Lift on hover (translateY -8px)
- Expanding glow shadow on hover
- Spring easing for natural feel
- Icon + title + description + details layout

---

## Animation System

### Timing Functions
```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);       /* Material */
```

### Core Animations

**fadeInUp** - Entry animation for content
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**pulse-glow** - Attention-drawing pulse for recovery banner
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.35); }
}
```

**shimmer** - Loading/highlight effect
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

### Stagger Classes
```css
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
```

---

## Texture & Depth

### Noise Overlay
A subtle SVG noise texture applied to the body for depth:
```css
body::before {
  background-image: url("data:image/svg+xml,...");
  opacity: 0.025;
}
```

### Shadow System
```css
--shadow-gold: 0 4px 24px rgba(212, 175, 55, 0.2);
--shadow-emerald: 0 4px 24px rgba(16, 185, 129, 0.25);
--shadow-crimson: 0 4px 24px rgba(220, 38, 38, 0.25);
--shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.5);
```

### Decorative Elements

**Gold Divider**
```css
.divider-gold {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--gold-dim) 20%,
    var(--gold) 50%,
    var(--gold-dim) 80%,
    transparent 100%
  );
}
```

---

## Screen-by-Screen

### Home (`/`)
- Centered logo with gold gradient background
- Three action cards with state colors
- Quick stats grid at bottom
- Staggered fade-in animations

### Session (`/session`)
- Minimal header with round counter
- P&L display with progress bars
- Vertical ladder visualization
- Large WIN/LOSS buttons at bottom

### Decision (`/decision`)
- "Decision Point" badge with pulse indicator
- Current status card
- Three roguelike choice cards
- Staggered entrance animations

### Summary (`/summary`)
- Large result icon (checkmark or X)
- Dramatic P&L display
- Stats breakdown
- Gold divider accent

---

## Accessibility

- Focus states use gold ring with offset
- Sufficient color contrast (WCAG AA)
- Touch targets minimum 44x44px
- No reliance on color alone for state

---

## PWA Considerations

- Safe area padding for notched devices
- Theme color matches noir background
- Standalone display mode
- Apple-specific meta tags for iOS

---

## Future Enhancements

Potential additions to the design system:
- Haptic feedback integration
- Sound design (subtle clicks, win/loss audio)
- Particle effects for big wins
- Chart/graph styling for history analytics
- Custom cursor for desktop
