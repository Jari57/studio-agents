# Studio Agents v2.0 - Premium UI Code Patterns & Reference

## 🎨 Master Copy-Paste Components

Use these patterns for future UI additions to Studio Agents.

---

## 1. PREMIUM CARD TEMPLATE

```jsx
// Basic premium card with glassmorphism
<div className="p-6 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 hover:border-white/25 transition-all duration-300 backdrop-blur-sm">
  {/* Content here */}
</div>

// Card with neon glow hover
<div className="p-6 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 hover:from-white/12 hover:to-white/5 hover:border-[#00ff41]/50 transition-all duration-300 backdrop-blur-sm">
  {/* Content here */}
</div>
```

---

## 2. PREMIUM BUTTON STYLES

### Secondary Button (Subtle)
```jsx
<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-white/10 to-white/5 text-white/80 hover:from-white/15 hover:to-white/10 border border-white/15 hover:border-[#00ff41]/50 text-sm font-medium transition-all duration-300 hover:text-[#00ff41]">
  Action
</button>
```

### Primary Button (Neon Green)
```jsx
<button className="py-4 bg-gradient-to-r from-[#00ff41]/80 to-[#00ff41]/60 hover:from-[#00ff41] hover:to-[#00ff41]/80 text-black font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#00ff41]/30 border border-[#00ff41]/50">
  Primary Action
</button>
```

### Icon Button
```jsx
<button className="w-10 h-10 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 hover:border-white/20 transition-all">
  <Icon size={24} className="text-white" />
</button>
```

---

## 3. NEON GLOW EFFECTS

### Icon with Glow
```jsx
<div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#00ff41]/20 to-[#00ff41]/5 flex items-center justify-center flex-shrink-0 border border-[#00ff41]/30 shadow-lg shadow-[#00ff41]/20">
  <Icon size={26} className="text-[#00ff41]" />
</div>
```

### Title with Text Glow
```jsx
<h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg" 
    style={{textShadow: '0 0 30px rgba(0, 255, 65, 0.3)'}}>
  Premium Title
</h1>
```

### Element with Border Glow
```jsx
<div className="border border-[#00ff41]/40 shadow-lg shadow-[#00ff41]/20">
  Glowing element
</div>
```

---

## 4. INPUT FIELD STYLES

### Standard Input
```jsx
<input 
  type="text"
  placeholder="Enter text..."
  className="w-full px-5 py-4 rounded-xl bg-gradient-to-r from-white/8 to-white/3 border border-white/15 text-white placeholder-white/40 focus:border-[#00ff41]/50 focus:bg-white/10 outline-none transition-all duration-200 backdrop-blur-sm"
/>
```

### Password Input
```jsx
<input 
  type="password"
  placeholder="Password (6+ chars)"
  className="w-full px-5 py-3.5 bg-gradient-to-r from-white/8 to-white/3 border border-white/15 rounded-lg text-white placeholder-white/40 focus:border-[#00ff41]/50 focus:bg-white/10 outline-none transition-all duration-200 backdrop-blur-sm"
/>
```

---

## 5. BADGE / LABEL STYLES

### Neon Green Badge
```jsx
<span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00ff41]/20 to-[#00ff41]/5 text-[#00ff41] text-sm font-semibold border border-[#00ff41]/30">
  Premium Badge
</span>
```

### Subtle Badge
```jsx
<span className="px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 text-white/80 text-sm font-medium border border-white/15">
  Subtle Badge
</span>
```

---

## 6. GLASSMORPHIC MODAL

```jsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
  <div className="w-full max-w-md bg-gradient-to-b from-black/95 to-black/80 rounded-t-2xl sm:rounded-2xl border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
    {/* Modal content */}
  </div>
</div>
```

---

## 7. EXPANDABLE SECTION

```jsx
<div className="rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm hover:border-white/25 transition-all duration-300">
  {/* Header Button */}
  <button
    onClick={() => setExpanded(!expanded)}
    className="w-full p-5 hover:bg-white/5 transition-colors flex items-center justify-between"
  >
    <div>
      <h3 className="font-bold text-white text-lg">{title}</h3>
      <p className="text-sm text-white/60 mt-1.5">{subtitle}</p>
    </div>
    <ChevronDown size={20} className={`text-[#00ff41]/60 transition-transform duration-300 flex-shrink-0 ${expanded ? 'rotate-180 text-[#00ff41]' : ''}`} />
  </button>
  
  {/* Expanded Content */}
  {expanded && (
    <div className="px-5 pb-5 space-y-3 border-t border-white/10 bg-black/30">
      {/* Content here */}
    </div>
  )}
</div>
```

---

## 8. MESSAGE BUBBLE STYLES

### User Message
```jsx
<div className="max-w-[85%] px-5 py-4 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#00ff41]/40 to-[#00ff41]/20 text-white rounded-br-sm border border-[#00ff41]/50 shadow-lg shadow-[#00ff41]/20">
  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
</div>
```

### AI Message
```jsx
<div className="max-w-[85%] px-5 py-4 rounded-2xl rounded-bl-sm bg-gradient-to-br from-white/10 to-white/5 text-white/90 border border-white/15 backdrop-blur-sm">
  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
</div>
```

### Error Message
```jsx
<div className="max-w-[85%] px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 rounded-bl-sm shadow-lg shadow-red-500/10">
  <p className="text-sm">{error}</p>
</div>
```

---

## 9. HEADER TEMPLATE

```jsx
<header className="px-6 pt-8 pb-6 border-b border-white/10 safe-top backdrop-blur-sm bg-gradient-to-b from-black/40 to-black/20">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg" 
          style={{textShadow: '0 0 30px rgba(0, 255, 65, 0.3)'}}>
        {title}
      </h1>
      {subtitle && <p className="text-white/50 text-base mt-2 font-light tracking-wide">{subtitle}</p>}
    </div>
    {/* Optional action on right */}
  </div>
</header>
```

---

## 10. NAVIGATION BAR

```jsx
<nav className="bg-gradient-to-t from-black via-black/95 to-black/80 border-t border-white/10 safe-bottom backdrop-blur-lg">
  <div className="flex justify-around py-3 px-2">
    {tabs.map(tab => (
      <button 
        key={tab.id} 
        onClick={() => setActiveTab(tab.id)}
        className={`flex flex-col items-center py-3 px-5 rounded-xl transition-all duration-300 ${
          activeTab === tab.id 
            ? 'text-[#00ff41] bg-gradient-to-b from-[#00ff41]/20 to-[#00ff41]/5 border border-[#00ff41]/40 shadow-lg shadow-[#00ff41]/20' 
            : 'text-white/50 hover:text-white/80'
        }`}
      >
        <tab.icon size={24} className={activeTab === tab.id ? 'drop-shadow-lg' : ''} style={activeTab === tab.id ? {textShadow: '0 0 10px rgba(0, 255, 65, 0.6)'} : {}} />
        <span className={`text-xs mt-1.5 font-semibold tracking-wide ${activeTab === tab.id ? 'text-[#00ff41]' : 'text-white/50'}`}>
          {tab.label}
        </span>
      </button>
    ))}
  </div>
</nav>
```

---

## 11. LOADING STATE

```jsx
<div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-gradient-to-r from-[#00ff41]/10 to-transparent border border-[#00ff41]/30 shadow-lg shadow-[#00ff41]/10">
  <div className="flex items-center gap-2">
    <Loader2 size={16} className="animate-spin text-[#00ff41]" />
    <span className="text-[#00ff41] text-sm font-medium">Thinking...</span>
  </div>
</div>
```

---

## 12. LIST ITEM WITH ICON

```jsx
<div className="text-sm text-white/70 pt-1 flex items-start gap-3">
  <span className="text-[#00ff41] font-bold text-lg mt-0.5 flex-shrink-0">→</span>
  <span className="leading-relaxed">List item text goes here with proper line height</span>
</div>
```

---

## 13. PROGRESS INDICATOR

```jsx
<div className="flex justify-center gap-2">
  {items.map((_, i) => (
    <div
      key={i}
      className={`rounded-full transition-all duration-300 ${
        i === current ? 'w-8 h-2 bg-[#00ff41] shadow-lg shadow-[#00ff41]/50' 
        : i < current ? 'w-2 h-2 bg-[#00ff41]/60' 
        : 'w-2 h-2 bg-white/20'
      }`}
    />
  ))}
</div>
```

---

## 14. DIVIDER

```jsx
<div className="flex items-center gap-3">
  <div className="flex-1 h-px bg-gradient-to-r from-[#00ff41]/20 to-transparent" />
  <span className="text-white/50 text-sm font-light">or</span>
  <div className="flex-1 h-px bg-gradient-to-l from-[#00ff41]/20 to-transparent" />
</div>
```

---

## 15. ERROR STATE

```jsx
<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
  <AlertCircle size={16} />
  {error}
</div>
```

---

## Color Reference

```css
/* Neon Green */
#00ff41              /* Primary accent */
rgba(0, 255, 65, 1)  /* Full opacity */
rgba(0, 255, 65, 0.8) /* 80% opacity */
rgba(0, 255, 65, 0.5) /* 50% opacity */
rgba(0, 255, 65, 0.3) /* 30% opacity */
rgba(0, 255, 65, 0.2) /* 20% opacity */
rgba(0, 255, 65, 0.1) /* 10% opacity */
rgba(0, 255, 65, 0.05) /* 5% opacity */

/* White Spectrum */
white                /* 100% */
rgba(255, 255, 255, 0.95) /* Primary text */
rgba(255, 255, 255, 0.7)  /* Secondary text */
rgba(255, 255, 255, 0.5)  /* Tertiary text */
rgba(255, 255, 255, 0.4)  /* Placeholder */
rgba(255, 255, 255, 0.3)  /* Subtle */
rgba(255, 255, 255, 0.15) /* Borders */
rgba(255, 255, 255, 0.1)  /* Card background */
rgba(255, 255, 255, 0.08) /* Deep background */
rgba(255, 255, 255, 0.05) /* Minimal */
rgba(255, 255, 255, 0.03) /* Almost invisible */

/* Black (Backgrounds) */
#000000              /* Pure black */
rgba(0, 0, 0, 0.8)   /* Elevated background */
rgba(0, 0, 0, 0.5)   /* Transparent overlay */
rgba(0, 0, 0, 0.4)   /* Modal background */
rgba(0, 0, 0, 0.3)   /* Subtle overlay */
```

---

## Transition Patterns

```jsx
// Smooth transition (default)
transition-all duration-300

// Fast transition (micro-interactions)
transition-all duration-200

// Slow transition (emphasis)
transition-all duration-500

// Specific property
transition-colors duration-300
transition-transform duration-300
transition-opacity duration-200
```

---

## Rounded Corner Sizes

```jsx
rounded-none      /* 0px */
rounded-sm        /* 4px */
rounded           /* 6px */
rounded-lg        /* 8px */
rounded-xl        /* 12px */
rounded-2xl       /* 16px */
rounded-3xl       /* 24px */

/* Studio Agents standard: rounded-xl for buttons, rounded-2xl for cards */
```

---

## Spacing Grid

```jsx
px-1 / py-1       /* 4px */
px-2 / py-2       /* 8px */
px-3 / py-3       /* 12px */
px-4 / py-4       /* 16px */
px-5 / py-5       /* 20px */
px-6 / py-6       /* 24px */
px-8 / py-8       /* 32px */

/* Studio Agents standard: 6px (px-6), 5px (py-5), 4px (py-4) */
```

---

## Font Sizes

```jsx
text-xs            /* 12px */
text-sm            /* 14px */
text-base          /* 16px */
text-lg            /* 18px */
text-xl            /* 20px */
text-2xl           /* 24px */
text-3xl           /* 30px */
text-4xl           /* 36px */

/* Studio Agents standard: text-4xl for main titles, text-base for body */
```

---

## Font Weights

```jsx
font-light         /* 300 */
font-normal        /* 400 */
font-medium        /* 500 */
font-semibold      /* 600 */
font-bold          /* 700 */
font-black         /* 900 */

/* Studio Agents standard: font-black for titles, font-bold for headings */
```

---

## Shadow Reference

```jsx
shadow-lg shadow-[#00ff41]/20   /* Neon glow shadow */
shadow-lg shadow-white/10        /* White subtle shadow */
shadow-lg shadow-black/50        /* Dark shadow */
drop-shadow-lg                   /* Alternative glow */
```

---

## Quick Checklist for New Components

When adding new components, ensure:
- [ ] Use glassmorphic background: `from-white/8 to-white/3`
- [ ] Add neon green accents on hover
- [ ] Include proper border: `border-white/15`
- [ ] Add 300ms smooth transition
- [ ] Use neon glow shadow for important elements
- [ ] Maintain consistent spacing (6px/5px grid)
- [ ] Test on mobile (touch-friendly)
- [ ] Check accessibility (contrast, focus)
- [ ] Verify animations are smooth
- [ ] Add loading/error states

---

## Testing Accessibility

```jsx
// Sufficient color contrast?
white on black = 19:1 ✅

// Visible focus state?
focus:border-[#00ff41]/50 ✅

// Touch-friendly button size?
48px minimum ✅

// Keyboard navigation?
All elements focusable ✅
```

---

**Version**: Studio Agents v2.0
**Last Updated**: January 2025
**Status**: Production Ready ✅

Use these patterns consistently across all future UI additions.
