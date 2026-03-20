@echo off
setlocal

set "ROOT=%~dp0"

echo ==========================================
echo Snowflake Windows Release Pipeline
 echo ==========================================

echo [1/2] Building Windows binaries...
call "%ROOT%build-win.bat"
if errorlevel 1 (
    echo ❌ Build failed.
    exit /b 1
)

echo [2/2] Packaging Windows ZIP...
call "%ROOT%package-win.bat"
if errorlevel 1 (
    echo ❌ Packaging failed.
    exit /b 1
)

echo.
echo ✅ Windows release complete.
exit /b 0
