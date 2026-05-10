# Budget Flow Pro — Installation Guide

## Phone (iPhone / Android)

1. Open **https://nevels1953.com** in your phone's browser (Safari on iPhone, Chrome on Android).
2. **iPhone**: Tap the Share button → "Add to Home Screen".
3. **Android**: Tap the browser menu (⋮) → "Install App" or "Add to Home Screen".
4. The app icon will appear on your home screen and works offline.

## Desktop (Windows)

### Option A: Quick Install (shortcut)
1. Double-click `install-budget-flow-pro.bat`.
2. A desktop shortcut to Budget Flow Pro will be created.

### Option B: Full Desktop App (Electron)
1. Make sure [Node.js](https://nodejs.org/) is installed.
2. Open a terminal in this folder and run:
   ```
   npm install
   npm start
   ```
3. The app opens as a standalone desktop window.

### Option C: Build Windows Installer (.exe)
1. Make sure Node.js is installed.
2. Run:
   ```
   npm install
   npm run dist:win
   ```
3. Find the `.exe` installer in the `dist/` folder.

## Desktop (Mac)
1. Make sure [Node.js](https://nodejs.org/) is installed.
2. Open Terminal in this folder and run:
   ```
   npm install
   npm start
   ```

## All Data Is Local
Your receipts and budget data are stored in your browser's localStorage. No server or account required. Use the Cloud Backup tab to export/import JSON backups.
