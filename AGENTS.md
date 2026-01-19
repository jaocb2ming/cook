# AGENTS.md - WeChat Mini Program Development Guide

## Project Overview
**Intimacy Hub** (cook) - A privacy-first WeChat Mini Program for tracking personal activities with a premium dark aesthetic.

## Technology Stack
- **Framework**: Native WeChat Mini Program (WXML, WXSS, JS)
- **Storage**: Local-only (`wx.setStorageSync` / `wx.getStorageSync`) - NO cloud sync
- **Platform**: WeChat DevTools (AppID: wx11972083787c2565)

## Build & Development
**NO build commands, NO linting, NO tests**

1. Open project in **WeChat Developer Tools**
2. Click "Compile" (Ctrl/Cmd + B) to build
3. Use "Preview" to test on real device
4. No CI/CD or automated testing

## Code Style Guidelines

### Imports & Exports
```javascript
// CommonJS only (no ES6 modules)
const storage = require('../../utils/storage');

module.exports = {
  getAllLogs,
  addLog,
  deleteLog
};
```

### Formatting
- **Indentation**: 2 spaces (insertSpaces, NOT tabs)
- **Line length**: No strict limit, but prefer < 100 chars
- **Semicolons**: Required
- **Quotes**: Single quotes preferred

### Naming Conventions
- **Functions/Variables**: camelCase (`addLog`, `yearlyGoal`, `tempGoal`)
- **Constants**: UPPER_SNAKE_CASE (rare - use SCSS/CSS vars instead)
- **Components**: camelCase
- **File names**: camelCase for JS (`settings.js`), lowercase for WXML/WXSS

### Types (No TypeScript)
This is a plain JS project. No type definitions or interfaces.
- Use JSDoc comments for complex functions
- Validate inputs before use (e.g., check `if (!date) return;`)

### Error Handling
```javascript
// Try-catch for file operations and external APIs
try {
  fs.writeFileSync(filePath, csv, 'utf8');
  wx.showToast({ title: 'Success', icon: 'success' });
} catch (e) {
  wx.showToast({ title: 'Failed', icon: 'none' });
}

// User feedback via WeChat API
if (!date || !time) {
  wx.showToast({
    title: '请选择日期和时间',
    icon: 'none'
  });
  return;
}
```

### Date Handling (CRITICAL)
**Always use `.replace(/-/g, '/')` for iOS compatibility:**
```javascript
const timestamp = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`).getTime();
```

### WeChat API Patterns
- **Storage**: Use synchronous methods (`wx.setStorageSync`, not `wx.setStorage`)
- **Navigation**: `wx.navigateTo({ url: '/pages/index/index' })`
- **Feedback**: `wx.showToast({ title: '...', icon: 'success' | 'none' })`
- **File System**: `wx.getFileSystemManager()` for CSV export

### Data Structure
```javascript
// Log entry format
{
  id: '1737000000000abc123',      // timestamp + random
  timestamp: 1737000000000,        // milliseconds
  date: '2026-01-16',             // formatted
  title: '45分钟 Cook',
  description: '强度: 4.2/5.0',
  duration: 45,
  intensity: 4.2,
  notes: 'optional notes'
}
```

### Page Lifecycle
```javascript
Page({
  data: { /* reactive state */ },

  onLoad() { /* initialize */ },
  onShow() { /* refresh data */ },
  onHide() { /* cleanup timers */ },
  onUnload() { /* final cleanup */ }
});
```

### Timer/Interval Cleanup
ALWAYS clear intervals on page hide/unload:
```javascript
onHide() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
},
onUnload() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
}
```

## Styling Guidelines

### Color System (Dark Theme)
```css
--bg-primary: #0a0a0a;          /* Main background */
--bg-secondary: #1a1a1a;       /* Cards, sections */
--bg-card: #1a1a1a;
--text-primary: #ffffff;
--text-secondary: #888888;
--accent-purple: #692797;      /* Primary brand */
--accent-purple-light: #d4a5f7;
--danger-red: #ef4444;
--success-green: #10b981;
```

### Glassmorphism Modals
Use `.modal-overlay` and `.modal-content` for all bottom sheets:
- 32px border-radius (fully rounded)
- `backdrop-filter: blur(25px) saturate(180%)`
- Bottom margin with safe-area: `calc(20px + env(safe-area-inset-bottom))`

### Button Styles
- Primary: `linear-gradient(135deg, #7c3aed, #4c1d95)`
- Full capsule: `border-radius: 28px`
- Height: 56px
- Active state: `transform: scale(0.97)`

## Architecture

### Directory Structure
```
cook/
├── app.js              # App lifecycle, global data
├── app.json            # Page routes, window config
├── app.wxss            # Global styles
├── utils/              # Pure utilities
│   ├── storage.js      # CRUD operations, export
│   └── heatmap.js      # Visualization logic
├── pages/
│   ├── index/          # Dashboard (hero, heatmap, timer)
│   └── settings/       # Config, data management
└── assets/icons/       # SVG icons
```

### Data Flow
1. **UI** → calls storage methods (e.g., `storage.addLog()`)
2. **Storage** → updates `wx.storage` + triggers `updateCount()`
3. **Page** → calls `loadData()` → `this.setData()` to refresh UI

## Key Constraints
- NO cloud sync - all data is local
- NO external dependencies beyond WeChat APIs
- NO TypeScript - plain JS only
- NO automated tests - manual testing in DevTools
- NO ESLint/Prettier - follow the style above manually
- iOS date parsing requires `/` not `-` in date strings

## Privacy First
- All data stored locally on device only
- No analytics, tracking, or telemetry
- User can export CSV for backup
- Explicit confirmation for destructive operations (clear/reset)
