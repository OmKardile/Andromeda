@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Andromeda - build APK

REM =====================================================================
REM  Andromeda launcher - one-shot APK builder (Windows)
REM
REM  usage:
REM    build-apk.bat              pull latest + build a debug APK
REM    build-apk.bat release      pull latest + build a release APK
REM                               (signed automatically when keystore.properties
REM                                exists next to app/ - see README, "Release signing")
REM    build-apk.bat install      debug APK + install to a connected
REM                               device/emulator via adb
REM    build-apk.bat nopull       skip the git pull (offline / local edits)
REM    build-apk.bat clean        clean + debug build
REM
REM  output:
REM    apk\Andromeda-<version>-debug.apk   (or -release.apk)
REM    the folder opens automatically when the build succeeds.
REM =====================================================================

set "MODE=%~1"
if "%MODE%"=="" set "MODE=debug"

set "PULL=1"
set "TASK=assembleDebug"
set "VARIANT=debug"

if /i "%MODE%"=="debug"   set "TASK=assembleDebug"
if /i "%MODE%"=="install" set "TASK=assembleDebug"
if /i "%MODE%"=="release" (set "TASK=assembleRelease" & set "VARIANT=release")
if /i "%MODE%"=="clean"   set "TASK=clean assembleDebug"
if /i "%MODE%"=="nopull"  set "PULL=0"

if /i not "%MODE%"=="debug" if /i not "%MODE%"=="install" if /i not "%MODE%"=="release" if /i not "%MODE%"=="clean" if /i not "%MODE%"=="nopull" (
    echo unknown option "%MODE%" - run without arguments for help.
    exit /b 2
)

echo.
echo === Andromeda build [%VARIANT%] ================================
echo.

REM ---- 1) pull the latest changes ------------------------------------
if "%PULL%"=="1" (
    where git >nul 2>nul
    if errorlevel 1 (
        echo [warn] git not on PATH - skipping pull, building current tree.
    ) else (
        git rev-parse --is-inside-work-tree >nul 2>nul
        if errorlevel 1 (
            echo [warn] not a git clone - downloaded zip? Skipping pull.
        ) else (
            echo [1/3] git pull --ff-only ...
            git pull --ff-only
            if errorlevel 1 (
                echo.
                echo [error] pull failed - local changes or diverged history.
                echo          stash and retry:   git stash ^&^& git pull --ff-only
                echo          or just build old: build-apk.bat nopull
                exit /b 1
            )
        )
    )
) else (
    echo [1/3] skipping git pull ^(requested^)
)

REM ---- 2) java preflight ----------------------------------------------
where java >nul 2>nul
if errorlevel 1 if not defined JAVA_HOME (
    echo [error] java not found. Install any JDK 17+ ^(or Android Studio^) and
    echo          reopen this window. If Android Studio is installed, its bundled
    echo          JDK can be used, e.g.:
    echo            set "JAVA_HOME=%%LOCALAPPDATA%%\Programs\Android Studio\jbr"
    exit /b 1
)

REM ---- 3) build --------------------------------------------------------
echo [2/3] gradlew %TASK%
echo.
call gradlew.bat --console=plain %TASK%
if errorlevel 1 (
    echo.
    echo [error] build failed - see the errors above.
    exit /b 1
)

REM ---- 4) locate + collect the APK -------------------------------------
echo.
echo [3/3] collecting APK ...
set "APK=app\build\outputs\apk\%VARIANT%\app-%VARIANT%.apk"
if not exist "%APK%" (
    echo [error] build reported success but %APK% is missing.
    exit /b 1
)

REM friendly versioned file name, read from app/build.gradle.kts
set "VER="
for /f "tokens=2 delims== " %%v in ('findstr /r /c:"versionName.*=.*" app\build.gradle.kts') do set "VER=%%~v"
if "%VER%"=="" set "VER=dev"
set "VER=%VER:"=%"

if not exist apk mkdir apk
set "OUT=apk\Andromeda-%VER%-%VARIANT%.apk"
copy /y "%APK%" "%OUT%" >nul

echo.
echo === OK ============================================================
echo   APK   : %OUT%
for %%A in ("%OUT%") do echo   size  : %%~zA bytes
echo.
if /i "%VARIANT%"=="release" if not exist keystore.properties (
    echo   note  : release is UNSIGNED - no keystore.properties found.
    echo            it will NOT install. See README "Release signing", or
    echo            just use the debug build:  build-apk.bat
    echo.
)
echo   to set as your launcher: install the APK, press Home,
echo   choose Andromeda, then "Always".

REM ---- 5) optional: install to a connected device ----------------------
if /i "%MODE%"=="install" call :do_install "%OUT%"

explorer /select,"%~dp0%OUT%"
endlocal
exit /b 0

REM ---- subroutine: adb install (runs outside parsed blocks, so adb ----
REM ---- resolution happens at execution time, no delayed expansion) -----
:do_install
set "ADB="
where adb >nul 2>nul && set "ADB=adb"
if not defined ADB if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not defined ADB if exist "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe" set "ADB=%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if not defined ADB if exist "C:\Android\platform-tools\adb.exe" set "ADB=C:\Android\platform-tools\adb.exe"
if not defined ADB (
    echo [warn] adb not found - open Android Studio once, or install
    echo         platform-tools. The APK is still built: %~1
    goto :eof
)
echo.
echo [install] "%ADB%" install -r "%~1"
"%ADB%" install -r "%~1"
if errorlevel 1 echo [warn] install failed - is a device connected with USB debugging?
goto :eof
