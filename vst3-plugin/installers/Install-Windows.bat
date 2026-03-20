@echo off
setlocal enabledelayedexpansion

echo ============================================
echo Snowflake Instrument Studio VST3 Installer
echo ============================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PACKAGE_ROOT=%SCRIPT_DIR%.."
set "PLUGIN_DIR=%PACKAGE_ROOT%\VST3"

if not exist "%PLUGIN_DIR%" (
  echo ERROR: Could not find VST3 folder at:
  echo %PLUGIN_DIR%
  echo Make sure this installer is inside the extracted ZIP package.
  pause
  exit /b 1
)

set "TARGET_DIR=%CommonProgramFiles%\VST3"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%" >nul 2>&1

echo Installing plugin to:
echo %TARGET_DIR%
echo.

set "FOUND=0"
for /d %%D in ("%PLUGIN_DIR%\*.vst3") do (
  set "FOUND=1"
  echo Copying %%~nxD ...
  xcopy "%%~fD" "%TARGET_DIR%\%%~nxD\" /E /I /Y >nul
)

if "%FOUND%"=="0" (
  echo ERROR: No .vst3 plugin found in %PLUGIN_DIR%
  echo Place SnowflakeInstrumentStudio.vst3 in the VST3 folder and run again.
  pause
  exit /b 1
)

echo.
echo SUCCESS: Plugin installed.
echo.
echo Next steps:
echo 1. Open Ableton Live Light
echo 2. Go to Preferences ^> Plug-ins
echo 3. Click Rescan
echo 4. Add Snowflake Instrument Studio to a MIDI track
echo.
pause
exit /b 0
