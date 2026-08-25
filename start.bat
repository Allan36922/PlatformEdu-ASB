@echo off
setlocal EnableDelayedExpansion
title EduPlatform + Edy Agent
color 0A

echo ============================================
echo   EduPlatform + Edy Agent - Startup
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Instala desde https://nodejs.org
    pause
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Python no encontrado. El agente de voz no estara disponible.
    echo           Solo funcionara el chat.
    set NO_PYTHON=1
)

:: Check if .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local no encontrado.
    pause
    exit /b 1
)

echo [1/6] Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Procesos anteriores detenidos.

echo [2/6] Limpiando cache de Turbopack...
if exist .next (
    rmdir /s /q .next 2>nul
    if exist .next (
        ren .next .next_old_%RANDOM% 2>nul
        echo       Cache renombrada (estaba bloqueada).
    ) else (
        echo       Cache limpiada.
    )
) else (
    echo       Cache ya limpia.
)

echo [3/6] Instalando dependencias de Node.js...
call npm install --silent 2>nul
echo       Dependencias listas.

if "%NO_PYTHON%"=="" (
    echo [4/6] Instalando dependencias de Python...
    if not exist "edy-agent\venv" (
        python -m venv edy-agent\venv 2>nul
    )
    call edy-agent\venv\Scripts\activate.bat 2>nul
    pip install -r edy-agent\requirements.txt --quiet 2>nul
    echo       Python listo.
) else (
    echo [4/6] Python no disponible, saltando agente de voz...
)

echo [5/6] Iniciando Next.js (http://localhost:3000)...
start "EduPlatform" cmd /c "npm run dev"

echo       Esperando a que Next.js compile...
timeout /t 35 /nobreak >nul

set RETRY=0
:WAIT_SERVER
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ 2>nul | findstr /C:"200" >nul
if errorlevel 1 (
    set /a RETRY+=1
    if !RETRY! geq 10 (
        echo       [ERROR] Next.js no arranco despues de 10 intentos.
        echo       Revisa la ventana de Next.js.
        pause
        exit /b 1
    )
    echo       Esperando... !RETRY!/10
    timeout /t 5 /nobreak >nul
    goto WAIT_SERVER
)
echo       Next.js listo!

if "%NO_PYTHON%"=="" (
    echo [6/6] Iniciando agente Edy (LiveKit)...
    start "Edy Agent" cmd /c "cd edy-agent && ..\edy-agent\venv\Scripts\activate.bat && python agent.py start"
) else (
    echo [6/6] Agente de voz no disponible (sin Python).
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
echo   Para ver el chat, inicia sesion y ve a /agente-edy
echo.
echo   Presiona Ctrl+C en cada ventana para detener.
echo ============================================
echo.
pause
