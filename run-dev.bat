@echo off
setlocal EnableExtensions
title PWA WEBSITE - LOCAL DEV SUITE

cd /d "%~dp0"
cls

echo ================================================================
echo   PWA WEBSITE - LOCAL DEVELOPMENT SUITE
echo   Docker removed. Backend, PWA App, and Admin run locally.
echo ================================================================
echo.

set "ROOT_DIR=%CD%"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "MINI_DIR=%ROOT_DIR%\mini-app"
set "ADMIN_DIR=%ROOT_DIR%\admin-dashboard"

set "BACKEND_PORT=8000"
set "MINI_PORT=3000"
set "ADMIN_PORT=3001"

echo [1] Checking tools and env files...
echo ------------------------------------------------

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo         Install Node.js 18+ first.
  goto fail
)
echo [OK] Node.js found.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  goto fail
)
echo [OK] npm found.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is not installed or not in PATH.
  echo         Install Python 3.10+ first.
  goto fail
)
echo [OK] Python found.

call :ensure_env "%BACKEND_DIR%\.env" "%BACKEND_DIR%\.env.example" "Backend"
call :ensure_env "%MINI_DIR%\.env" "%MINI_DIR%\.env.example" "PWA App"
call :ensure_env "%ADMIN_DIR%\.env" "%ADMIN_DIR%\.env.example" "Admin Dashboard"

if not exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
  echo [INFO] Creating backend virtual environment...
  pushd "%BACKEND_DIR%"
  python -m venv venv
  if errorlevel 1 (
    popd
    echo [ERROR] Failed to create backend venv.
    goto fail
  )
  popd
)
echo [OK] Backend venv ready.

if not exist "%MINI_DIR%\node_modules" (
  echo [WARN] PWA App node_modules is missing. Choose option 4 to install dependencies.
) else (
  echo [OK] PWA App dependencies found.
)

if not exist "%ADMIN_DIR%\node_modules" (
  echo [WARN] admin-dashboard node_modules is missing. Choose option 4 to install dependencies.
) else (
  echo [OK] Admin Dashboard dependencies found.
)

echo.
echo [2] Choose action:
echo ------------------------------------------------
echo   [1] Start all services
echo   [2] Start backend only        http://localhost:%BACKEND_PORT%
echo   [3] Start frontends only      Mini:%MINI_PORT% Admin:%ADMIN_PORT%
echo   [4] Install/update dependencies
echo   [5] Build all
echo   [6] Exit
echo.

set "CHOICE=1"
set /p CHOICE="Select option (1-6) [default: 1]: "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="1" goto start_all
if "%CHOICE%"=="2" goto start_backend_only
if "%CHOICE%"=="3" goto start_frontends
if "%CHOICE%"=="4" goto install_deps
if "%CHOICE%"=="5" goto build_all
if "%CHOICE%"=="6" goto done
goto start_all

:install_deps
echo.
echo Installing backend dependencies...
pushd "%BACKEND_DIR%"
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
  popd
  echo [ERROR] Backend dependency install failed.
  goto fail
)
popd

echo.
echo Installing PWA App dependencies...
pushd "%MINI_DIR%"
call npm install
if errorlevel 1 (
  popd
  echo [ERROR] Mini App npm install failed.
  goto fail
)
popd

echo.
echo Installing Admin Dashboard dependencies...
pushd "%ADMIN_DIR%"
call npm install
if errorlevel 1 (
  popd
  echo [ERROR] Admin Dashboard npm install failed.
  goto fail
)
popd

echo.
echo [OK] Dependencies installed.
pause
goto start_all

:build_all
echo.
echo Building backend syntax check...
pushd "%BACKEND_DIR%"
call venv\Scripts\activate.bat
python -m py_compile app\core\config.py app\main.py
if errorlevel 1 (
  popd
  echo [ERROR] Backend syntax check failed.
  goto fail
)
popd

echo.
echo Building PWA App...
pushd "%MINI_DIR%"
call npm run build
if errorlevel 1 (
  popd
  echo [ERROR] Mini App build failed.
  goto fail
)
popd

echo.
echo Building Admin Dashboard...
pushd "%ADMIN_DIR%"
call npm run build
if errorlevel 1 (
  popd
  echo [ERROR] Admin Dashboard build failed.
  goto fail
)
popd

echo.
echo [OK] Build completed.
pause
goto done

:start_all
call :start_backend
call :start_mini
call :start_admin
goto summary

:start_backend_only
call :start_backend
goto summary

:start_frontends
call :start_mini
call :start_admin
goto summary

:start_backend
echo Starting FastAPI backend on port %BACKEND_PORT%...
start "FastAPI Backend %BACKEND_PORT%" cmd /k "cd /d ""%BACKEND_DIR%"" && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 127.0.0.1 --port %BACKEND_PORT%"
exit /b 0

:start_mini
echo Starting PWA Website on port %MINI_PORT%...
start "PWA Website %MINI_PORT%" cmd /k "cd /d ""%MINI_DIR%"" && npm run dev -- --host 127.0.0.1 --port %MINI_PORT%"
exit /b 0

:start_admin
echo Starting Admin Dashboard on port %ADMIN_PORT%...
start "Admin Dashboard %ADMIN_PORT%" cmd /k "cd /d ""%ADMIN_DIR%"" && npm run dev -- --host 127.0.0.1 --port %ADMIN_PORT%"
exit /b 0

:summary
echo.
echo ================================================================
echo   Services launched in separate command windows.
echo ------------------------------------------------
echo   Backend API       http://localhost:%BACKEND_PORT%
echo   Backend Docs      http://localhost:%BACKEND_PORT%/docs
echo   PWA Website       http://localhost:%MINI_PORT%
echo   Admin Dashboard   http://localhost:%ADMIN_PORT%
echo.
echo   Env files:
echo   - backend\.env             server secrets and Beeknoee/Supabase
echo   - mini-app\.env            public VITE_* and PWA Web config
echo   - admin-dashboard\.env     public VITE_* admin config
echo ================================================================
echo.
pause
goto done

:ensure_env
set "ENV_PATH=%~1"
set "EXAMPLE_PATH=%~2"
set "LABEL=%~3"
if exist "%ENV_PATH%" (
  echo [OK] %LABEL% .env exists.
  exit /b 0
)
if exist "%EXAMPLE_PATH%" (
  copy "%EXAMPLE_PATH%" "%ENV_PATH%" >nul
  echo [WARN] %LABEL% .env was missing. Created from .env.example.
  echo        Review and fill real values before running production/deploy.
  exit /b 0
)
echo [WARN] %LABEL% has no .env or .env.example.
exit /b 0

:fail
echo.
echo Startup failed. Fix the error above and run this file again.
pause
exit /b 1

:done
endlocal
exit /b 0
