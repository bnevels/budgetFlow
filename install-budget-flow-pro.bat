@echo off
setlocal
title Budget Flow Pro Installer

echo ==============================================
echo        Budget Flow Pro - Easy Installer
echo ==============================================
echo.
echo This will create a desktop shortcut and open Budget Flow Pro.
echo.

set "APP_NAME=Budget Flow Pro"
set "APP_URL=https://nevels1953.com"
set "SHORTCUT=%USERPROFILE%\Desktop\Budget Flow Pro.url"

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
echo Opening Budget Flow Pro now...
start "" "%APP_URL%"

echo.
echo INSTALL COMPLETE!
echo.
echo To use the app later, double-click "Budget Flow Pro" on your Desktop.
echo.
echo On Chrome or Edge, you can also click the install icon in the address bar
echo to install it like a regular app.
echo.
pause
endlocal
