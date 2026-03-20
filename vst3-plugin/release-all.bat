@echo off
setlocal

set "ROOT=%~dp0"

echo ==========================================
echo Snowflake Unified Release Pipeline
echo ==========================================

echo Running Windows release flow...
call "%ROOT%release-win.bat"
if errorlevel 1 (
    echo ❌ Release failed.
    exit /b 1
)

echo.
echo ✅ Completed release flow for: Windows
echo 📁 Output files:
dir /b "%ROOT%dist\*.zip" 2>nul
dir /b "%ROOT%dist\*.sha256" 2>nul

exit /b 0
