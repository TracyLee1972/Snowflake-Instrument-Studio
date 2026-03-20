@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "VERSION=1.0.0"
set "ROOT=%~dp0"
set "DIST=%ROOT%dist"
set "PKG_NAME=SnowflakeInstrumentStudio-%VERSION%-Windows"
set "PKG_DIR=%DIST%\%PKG_NAME%"
set "ZIP_PATH=%DIST%\%PKG_NAME%.zip"

set "VST3_SRC=%ROOT%build-win\SnowflakeInstrumentStudio-VST3_artefacts\Release\VST3"
set "APP_SRC=%ROOT%build-win\SnowflakeInstrumentStudio-Standalone_artefacts\Release"

echo ==========================================
echo Packaging Windows Release
 echo ==========================================

if not exist "%VST3_SRC%" (
    echo ERROR: Missing VST3 build artifacts at:
    echo %VST3_SRC%
    echo Run build-win.bat first.
    exit /b 1
)

if not exist "%DIST%" mkdir "%DIST%"
if exist "%PKG_DIR%" rmdir /s /q "%PKG_DIR%"
if exist "%ZIP_PATH%" del /q "%ZIP_PATH%"

mkdir "%PKG_DIR%\VST3"
mkdir "%PKG_DIR%\Standalone"
mkdir "%PKG_DIR%\Documentation"
mkdir "%PKG_DIR%\Installer"
mkdir "%PKG_DIR%\Samples\Drums"
mkdir "%PKG_DIR%\Samples\Synths"
mkdir "%PKG_DIR%\Samples\Basses"

REM Copy binaries
xcopy "%VST3_SRC%\*.vst3" "%PKG_DIR%\VST3\" /E /I /Y >nul
if exist "%APP_SRC%\Snowflake Instrument Studio.exe" (
    copy /Y "%APP_SRC%\Snowflake Instrument Studio.exe" "%PKG_DIR%\Standalone\" >nul
)

REM Copy docs/license
copy /Y "%ROOT%README.md" "%PKG_DIR%\Documentation\README.md" >nul
copy /Y "%ROOT%QUICKSTART.md" "%PKG_DIR%\Documentation\QUICKSTART.md" >nul
copy /Y "%ROOT%BUILD.md" "%PKG_DIR%\Documentation\BUILD.md" >nul
copy /Y "%ROOT%INSTALL_Windows.md" "%PKG_DIR%\Documentation\INSTALL_Windows.md" >nul
copy /Y "%ROOT%ABLETON_LIVE_LIGHT_GUIDE.md" "%PKG_DIR%\Documentation\ABLETON_LIVE_LIGHT_GUIDE.md" >nul
copy /Y "%ROOT%COMMERCIAL_LICENSE.md" "%PKG_DIR%\Documentation\COMMERCIAL_LICENSE.md" >nul
copy /Y "%ROOT%LICENSE" "%PKG_DIR%\LICENSE.txt" >nul

REM Copy installer scripts
copy /Y "%ROOT%installers\Install-Windows.bat" "%PKG_DIR%\Installer\Install-Windows.bat" >nul
copy /Y "%ROOT%installers\INSTALLER_README.txt" "%PKG_DIR%\Installer\INSTALLER_README.txt" >nul

REM Build sample readme
(
    echo # Samples
    echo Put your WAV files into Drums, Synths, or Basses folders.
    echo The plugin accepts WAV files and can auto-map them.
) > "%PKG_DIR%\Samples\README.md"

REM Create zip with PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%PKG_DIR%\*' -DestinationPath '%ZIP_PATH%' -Force"
if errorlevel 1 (
    echo ERROR: Failed to create ZIP.
    exit /b 1
)

REM Create SHA256
certutil -hashfile "%ZIP_PATH%" SHA256 > "%ZIP_PATH%.sha256"

echo.
echo SUCCESS: Created package:
echo %ZIP_PATH%
echo.
exit /b 0
