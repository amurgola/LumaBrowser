@echo off
setlocal

cd /d "%~dp0.."

set "DISTROARG="
if not "%LUMA_WSL_DISTRO%"=="" set "DISTROARG=-d %LUMA_WSL_DISTRO%"
set "FLAGS="

:parse
if "%~1"=="" goto parsed
if /i "%~1"=="--setup" (
  set "FLAGS=%FLAGS% --setup"
  shift
  goto parse
)
if /i "%~1"=="--fast" (
  set "FLAGS=%FLAGS% --fast"
  shift
  goto parse
)
if /i "%~1"=="--distro" (
  if "%~2"=="" (
    echo [build-linux] --distro needs a distro name
    exit /b 2
  )
  set "DISTROARG=-d %~2"
  shift
  shift
  goto parse
)
echo [build-linux] unknown option: %~1
exit /b 2
:parsed

where wsl >nul 2>&1
if errorlevel 1 (
  echo [build-linux] wsl.exe not found - install WSL first ^("wsl --install"^)
  exit /b 1
)

wsl %DISTROARG% -e true >nul 2>&1
if errorlevel 1 (
  echo [build-linux] cannot start the WSL distro. Available:
  wsl --list --verbose
  exit /b 1
)

set "WINPATH=%CD%"
set "WINPATH=%WINPATH:\=/%"
set "SRCWSL="
for /f "usebackq delims=" %%i in (`wsl %DISTROARG% -e wslpath -a "%WINPATH%"`) do set "SRCWSL=%%i"
if "%SRCWSL%"=="" (
  echo [build-linux] could not translate "%CD%" to a WSL path
  exit /b 1
)
echo [build-linux] repo in WSL: %SRCWSL%

wsl %DISTROARG% -- bash -c "cp '%SRCWSL%/scripts/build-linux.sh' /tmp/luma-build-linux.sh && sed -i 's/\r$//' /tmp/luma-build-linux.sh && chmod +x /tmp/luma-build-linux.sh"
if errorlevel 1 (
  echo [build-linux] could not stage scripts/build-linux.sh inside WSL
  exit /b 1
)

wsl %DISTROARG% -- bash /tmp/luma-build-linux.sh "%SRCWSL%"%FLAGS%
if errorlevel 1 (
  echo [build-linux] build failed
  exit /b 1
)

echo.
echo [build-linux] Done. Artifacts in dist\:
dir /b dist\*.AppImage
endlocal
