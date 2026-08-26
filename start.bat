@echo off
setlocal EnableDelayedExpansion
title EduPlatform + Edy Agent
color 0A

echo ============================================
echo   EduPlatform + Edy Agent - Startup
echo ============================================
echo.

:: ── 1. Check prerequisites ──────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Instala desde https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] curl no encontrado.
    pause
    exit /b 1
)
echo [OK] curl encontrado

if not exist .env.local (
    echo [ERROR] .env.local no encontrado en %CD%
    pause
    exit /b 1
)
echo [OK] .env.local encontrado

:: Check Python (optional - agent won't start without it)
set HAS_PYTHON=0
where python >nul 2>&1
if %errorlevel% equ 0 (
    set HAS_PYTHON=1
    echo [OK] Python encontrado
) else (
    echo [WARNING] Python no encontrado - solo funcionara el chat de texto
)

:: ── 2. Kill processes on port 3000 ──────────────────────────────────
echo.
echo [1/5] Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo       Puerto 3000 liberado.

:: ── 3. Clean Turbopack cache ────────────────────────────────────────
echo [2/5] Limpiando cache de Turbopack...
if exist .next (
    rmdir /s /q .next 2>nul
)
echo       Cache limpiada.

:: ── 4. Install Node dependencies ────────────────────────────────────
echo [3/5] Instalando dependencias de Node.js...
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm install fallo.
    pause
    exit /b 1
)
echo       Dependencias listas.

:: ── 5. Install Python dependencies (if Python available) ────────────
if "%HAS_PYTHON%"=="1" (
    echo [4/5] Preparando agente de voz...
    if not exist "edy-agent\venv" (
        echo       Creando virtualenv...
        python -m venv edy-agent\venv 2>nul
    )
    call edy-agent\venv\Scripts\activate.bat 2>nul
    pip install -r edy-agent\requirements.txt --quiet 2>nul
    echo       Agente de voz listo.
) else (
    echo [4/5] Python no disponible, saltando agente de voz...
)

:: ── 6. Start Next.js ────────────────────────────────────────────────
echo.
echo [5/5] Iniciando Next.js...
start "EduPlatform" cmd /k "cd /d %CD% && npm run dev"
echo       Ventana de Next.js abierta.

:: Wait for Next.js to be ready
echo       Esperando a que Next.js compile...
set RETRY=0
:WAIT_SERVER
timeout /t 3 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ 2>nul | findstr /C:"200" >nul
if errorlevel 1 (
    set /a RETRY+=1
    if !RETRY! geq 25 (
        echo.
        echo       [INFO] Next.js tarda mas de lo esperado.
        echo       Puede que ya este compilando. Abre http://localhost:3000 para verificar.
        goto DONE
    )
    echo       Esperando... !RETRY!/25
    goto WAIT_SERVER
)
echo       Next.js listo en puerto 3000!

:DONE
:: ── 7. Start Edy Agent (if Python available) ───────────────────────
if "%HAS_PYTHON%"=="1" (
    echo.
    echo Iniciando agente Edy (LiveKit)...
    start "Edy Agent" cmd /k "cd /d %CD%\edy-agent && ..\edy-agent\venv\Scripts\activate.bat && python agent.py start"
    echo       Agente Edy iniciado en ventana separada.
)

echo.
echo ============================================
echo   Todo listo!
echo ============================================
echo.
echo   Frontend:   http://localhost:3000
echo   Agente Edy: http://localhost:3000/agente-edy
echo   Chat:       http://localhost:3000/agente-edy (pestana Chat)
echo.
echo   Cierra esta ventana y usa las otras ventanas.
echo   Presiona Ctrl+C en cada ventana para detener.
echo ============================================
echo.
pause
