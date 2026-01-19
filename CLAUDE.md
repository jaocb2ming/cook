# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intimacy Hub** (cook) - A privacy-first WeChat Mini Program for tracking personal activities with a premium dark aesthetic. All data is stored locally on device.

## Development

Open the project in **WeChat Developer Tools** and use "Compile" (Ctrl/Cmd + B) to build. No build tools, linting, or automated tests are configured.

## Key Technical Constraints

- **Date handling**: iOS requires `/` not `-` in date strings. Always use `.replace(/-/g, '/')` when parsing dates:
  ```javascript
  new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`)
  ```

- **Storage**: Use synchronous methods (`wx.setStorageSync`, `wx.getStorageSync`)

- **Timer cleanup**: Always clear intervals in both `onHide()` and `onUnload()` lifecycle hooks

- **Module system**: CommonJS only (`require` / `module.exports`), no ES6 modules

- **No TypeScript**: Plain JavaScript with JSDoc for complex functions

## Architecture

### Data Flow
```
UI → storage methods (utils/storage.js) → wx.storage → updateCount() → loadData() → setData()
```

### Core Modules

| Module | Purpose |
|--------|---------|
| `utils/storage.js` | CRUD operations, config management, CSV export, progress tracking |
| `utils/heatmap.js` | Converts timestamps to GitHub-style visualization grid |
| `utils/supabase.js` | Optional cloud sync (disabled by default) |

### Data Structures

**Log Entry:**
```javascript
{
  id: '1737000000000abc123',   // timestamp + random
  timestamp: 1737000000000,
  date: '2026-01-16',
  title: '45分钟 Cook',
  description: '强度: 4.2/5.0',
  duration: 45,
  intensity: 4.2,              // 1.0 - 5.0
  notes: 'optional notes'
}
```

**App Config:**
```javascript
{
  yearlyGoal: 150,
  currentCount: 0,
  version: '1.0.2',
  cloudSync: false,
  syncKey: ''                   // UUID for optional cloud sync
}
```

## Code Style

- **Indentation**: 2 spaces (not tabs)
- **Semicolons**: Required
- **Quotes**: Single quotes preferred
- **Naming**: camelCase for functions/variables
- **Error feedback**: Use `wx.showToast({ title: '...', icon: 'none' })`

## Visual Design

**Dark theme colors:**
```css
--bg-primary: #0a0a0a
--bg-secondary: #1a1a1a
--text-primary: #ffffff
--text-secondary: #888888
--accent-purple: #692797
--accent-purple-light: #d4a5f7
```

**Glassmorphism modals:** `.modal-overlay` + `.modal-content` with `backdrop-filter: blur(25px) saturate(180%)`, 32px border-radius

**Primary buttons:** `linear-gradient(135deg, #7c3aed, #4c1d95)`, 56px height, 28px border-radius, `transform: scale(0.97)` on active

## Privacy

All data is local-only. No analytics, tracking, or telemetry. Users can export CSV for backup. Destructive operations require explicit confirmation.
