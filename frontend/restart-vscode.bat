@echo off
echo Restarting VS Code to apply new schema settings...
echo.
echo Please save any unsaved work before continuing.
echo.
pause

taskkill /f /im code.exe >nul 2>&1

echo.
echo VS Code has been closed. The local JSON schemas are now configured.
echo Please restart VS Code manually to apply the changes.
echo.
pause