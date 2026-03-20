@echo off
REM Build script for Windows (Visual Studio)
setlocal

echo 🎵 Building Snowflake Instrument Studio for Windows...

REM Create build directory
if not exist build-win mkdir build-win
cd build-win

REM Configure CMake for Visual Studio 2022
cmake -G "Visual Studio 17 2022" -A x64 -DBUILD_VST3=ON -DBUILD_STANDALONE=ON ..
if errorlevel 1 (
	echo ❌ CMake configure failed.
	exit /b 1
)

REM Build both VST3 and Standalone
cmake --build . --config Release --parallel
if errorlevel 1 (
	echo ❌ Build failed.
	exit /b 1
)

echo ✅ Build complete!
echo 📦 VST3 plugin: build-win\SnowflakeInstrumentStudio-VST3_artefacts\Release\VST3\
echo 🎹 Standalone app: build-win\SnowflakeInstrumentStudio-Standalone_artefacts\Release\
exit /b 0
