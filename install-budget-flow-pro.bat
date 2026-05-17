@echo off
setlocal
title Budget Planner Premium+ Installer

echo ==============================================
echo      Budget Planner Premium+ - Easy Installer
echo ==============================================
echo.
echo This will create a desktop shortcut and open Budget Planner Premium+.
echo.

set "APP_NAME=Budget Planner Premium+"
set "APP_URL=https://nevels1953.com"
set "SHORTCUT=%USERPROFILE%\Desktop\Budget Planner Premium+.url"

echo Creating desktop shortcut...
(
  echo [InternetShortcut]
  echo URL=%APP_URL%
  echo IconFile=%SystemRoot%\System32\shell32.dll
  echo IconIndex=44
) > "%SHORTCUT%"

echo.
echo Desktop shortcut created:
echo %SHORTCUT%
echo.
echo Opening Budget Planner Premium+ now...
start "" "%APP_URL%"

echo.
echo INSTALL COMPLETE!
echo.
echo To use the app later, double-click "Budget Planner Premium+" on your Desktop.
echo.
echo On Chrome or Edge, you can also click Install App in the web app.
echo.
pause
endlocal
