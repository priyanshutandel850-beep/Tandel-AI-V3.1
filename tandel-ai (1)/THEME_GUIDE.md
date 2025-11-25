# Hacker Theme Guide

## Overview
Your Tandel AI app now supports **three themes**:
1. **Light Mode** - Clean, bright interface
2. **Dark Mode** - Modern dark interface (default)
3. **Hacker Mode** - Terminal-style green-on-black theme

## How to Use

### Switching Themes
Click the theme toggle button in the top-right corner of the app. It cycles through:
- Light → Dark → Hacker → Light (repeat)

The button icon changes based on the current theme:
- ☀️ Sun icon = Light mode
- 🌙 Moon icon = Dark mode  
- 💻 Terminal icon = Hacker mode

## Hacker Theme Features

### Visual Style
- **Background**: Deep black (#0a0e0a)
- **Sidebar**: Slightly lighter black (#0d120d)
- **Text**: Matrix-style green (#00ff41)
- **Borders**: Dark green (#1a3d1a)
- **Accents**: Bright green highlights

### Special Effects
- Monospace font for terminal feel
- Blinking cursor animation on "thinking" text
- Green glow on hover states
- Terminal-style scrollbars

### Color Palette
```css
--hacker-bg: #0a0e0a        /* Main background */
--hacker-sidebar: #0d120d   /* Sidebar background */
--hacker-input: #0f1a0f     /* Input areas */
--hacker-text: #00ff41      /* Primary text */
--hacker-dim: #00cc33       /* Dimmed text */
--hacker-border: #1a3d1a    /* Borders */
```

## Technical Implementation

The theme system uses:
- Tailwind CSS custom classes with `hacker:` prefix
- CSS custom properties for consistent colors
- Class-based theme switching on `<html>` element
- State management in React for theme persistence

## Customization

To modify the hacker theme colors, edit the CSS variables in `index.html`:
```css
.hacker {
  --hacker-bg: #0a0e0a;
  --hacker-text: #00ff41;
  /* ... other variables */
}
```
