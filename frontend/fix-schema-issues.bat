@echo off
echo.
echo ===== FIXING JSON SCHEMA ISSUES =====
echo.
echo This script will help resolve schema loading issues for package.json and tsconfig.json
echo.
echo Step 1: Verifying schema files...
if exist ".vscode\schemas\package.schema.json" (
    echo - Package schema: FOUND
) else (
    echo - Package schema: NOT FOUND - Error!
    exit /b 1
)

if exist ".vscode\schemas\tsconfig.schema.json" (
    echo - TSConfig schema: FOUND
) else (
    echo - TSConfig schema: NOT FOUND - Error!
    exit /b 1
)

echo.
echo Step 2: Verifying VS Code settings...
if exist ".vscode\settings.json" (
    echo - VS Code settings: FOUND
) else (
    echo - VS Code settings: NOT FOUND - Error!
    exit /b 1
)

echo.
echo ===== INSTRUCTIONS TO APPLY FIX =====
echo.
echo 1. Close VS Code completely
echo 2. Reopen VS Code
echo 3. The schema errors should now be resolved permanently
echo.
echo Note: This solution eliminates dependency on internet connectivity
echo       for schema validation and speeds up your development.
echo.
echo Press any key to continue...
pause > nul