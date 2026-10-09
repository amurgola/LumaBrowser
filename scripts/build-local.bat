@echo off
setlocal

cd /d "%~dp0.."

if "%~1"=="--ci" (
  echo [build-local] npm ci ...
  call npm ci
  if errorlevel 1 exit /b 1
)

if not exist "node_modules\electron-builder" (
  echo [build-local] node_modules missing - run "npm install" first, or re-run with --ci
  exit /b 1
)

set "WCS=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
set "WCS_DIR=%WCS%\winCodeSign-2.6.0"
set "WCS_CHECK=%WCS_DIR%\windows-10\x64\signtool.exe"

if exist "%WCS_CHECK%" goto :cache_ok

echo [build-local] winCodeSign cache missing - downloading and extracting...
if not exist "%WCS%" mkdir "%WCS%"
curl -fL -o "%TEMP%\winCodeSign-2.6.0.7z" "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
if errorlevel 1 (
  echo [build-local] download failed
  exit /b 1
)
"node_modules\7zip-bin\win\x64\7za.exe" x -y "%TEMP%\winCodeSign-2.6.0.7z" -o"%WCS_DIR%" >nul
del "%TEMP%\winCodeSign-2.6.0.7z" >nul 2>&1
if not exist "%WCS_CHECK%" (
  echo [build-local] winCodeSign extraction failed - signtool.exe not found
  exit /b 1
)
echo [build-local] winCodeSign cache ready

:cache_ok

echo [build-local] npm run build:jetbrains ...
call npm run build:jetbrains --if-present
if errorlevel 1 exit /b 1

echo [build-local] npm run build:vscode ...
call npm run build:vscode --if-present
if errorlevel 1 exit /b 1

echo [build-local] npm run build:docs-rag ...
call npm run build:docs-rag
if errorlevel 1 exit /b 1

echo [build-local] npm run build:win ...
call npm run build:win
if errorlevel 1 exit /b 1

echo.
echo [build-local] Done. Artifacts in dist\:
dir /b dist\*.exe
endlocal
