@echo off
title EduPlatform + Edy Agent
color 0A

echo ============================================
echo   EduPlatform + Edy Agent - Startup
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Instala Node.js desde https://nodejs.org
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
    echo [ERROR] .env.local no encontrado. Copia .env.example a .env.local y configura las credenciales.
    pause
    exit /b 1
)

echo [1/4] Limpiando cache de Turbopack...
if exist .next rmdir /s /q .next 2>nul
echo         Cache limpiada.

echo [1/4] Instalando dependencias de Node.js...
call npm install --silent 2>nul

if "%NO_PYTHON%"=="" (
    echo [2/5] Instalando dependencias de Python...
    if not exist "edy-agent\venv" (
        python -m venv edy-agent\venv 2>nul
    )
    call edy-agent\venv\Scripts\activate.bat 2>nul
    pip install -r edy-agent\requirements.txt --quiet 2>nul
) else (
    echo [2/4] Python no disponible, saltando agente de voz...
)

echo [3/5] Iniciando Next.js (http://localhost:3000)...
start "EduPlatform" cmd /c "npm run dev"

:: Wait for Next.js to compile and be ready
echo     Esperando a que Next.js compile (puede tardar 30-60s)...
timeout /t 30 /nobreak >nul

:: Verify server is up
echo     Verificando conexion...
:WAIT_SERVER
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ 2>nul | findstr /C:"200" >nul
if errorlevel 1 (
    echo     Servidor no listo, esperando 10s mas...
    timeout /t 10 /nobreak >nul
    goto WAIT_SERVER
)
echo     Next.js listo!

if "%NO_PYTHON%"=="" (
    echo [5/5] Iniciando agente Edy (LiveKit)...
    start "Edy Agent" cmd /c "cd edy-agent && ..\edy-agent\venv\Scripts\activate.bat && python agent.py start"
) else (
    echo [5/5] Agente de voz no disponible (sin Python).
)

echo.
echo ============================================
echo   Todo listo!
echo ============================================
echo.
echo   Frontend:  http://localhost:3000
echo   Agente Edy: http://localhost:3000/agente-edy
echo   Chat:       http://localhost:3000/agente-edy (pestana Chat)
echo.
echo   Para ver el chat, inicia sesion y ve a /agente-edy
echo.
echo   Presiona Ctrl+C en cada ventana para detener.
echo ============================================
echo.
pause
