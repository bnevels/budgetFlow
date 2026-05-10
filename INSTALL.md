# Budget Flow Pro — Installation Guide

## Phone (Easiest — One Tap Install)

1. Open **https://nevels1953.com** in your phone's browser.
2. Go to **Settings** tab → tap **"Install Budget Flow Pro"** button.
3. If the button isn't visible:
   - **iPhone**: Tap Share (box with arrow) → "Add to Home Screen"
   - **Android**: Tap browser menu (⋮) → "Install App" or "Add to Home Screen"
4. The app icon appears on your home screen and works offline.

## Desktop — One-Click Installers

Download the installer for your platform from [GitHub Releases](https://github.com/bnevels/budgetFlow/releases/latest):

| Platform | File | How to Install |
|----------|------|---------------|
| **Windows** | `.exe` | Double-click → installs automatically → launches the app |
| **Mac** | `.dmg` | Open → drag Budget Flow Pro to Applications |
| **Linux** | `.AppImage` | `chmod +x BudgetFlowPro.AppImage` → double-click to run |

## Desktop — From Source (Advanced)

1. Install [Node.js](https://nodejs.org/) (v20+).
2. Open a terminal in this folder:
   ```
   npm install
   npm start
   ```

## Portable Web Version

Extract `BudgetFlowPro-app.zip` and open `index.html` in any browser. No installation needed.

## All Data Is Local

Your receipts and budget data are stored in your browser/app's local storage. No server, account, or internet connection required after install. Use the Cloud Backup tab to export/import JSON backups.
