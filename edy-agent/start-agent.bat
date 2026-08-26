@echo off
setlocal
title Edy Voice Agent
color 0B

echo ============================================
echo   Edy Voice Agent - LiveKit
echo ============================================
echo.

:: Navigate to this script's directory
cd /d "%~dp0"
echo Directorio: %CD%
echo.

:: Check venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtualenv no encontrado en edy-agent\venv
    echo         Ejecuta: python -m venv venv
    echo         Luego:   venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

:: Activate venv
echo Activando virtualenv...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo activar el virtualenv
    pause
    exit /b 1
)

:: Check .env exists
if not exist ".env" (
    echo [ERROR] Archivo .env no encontrado en edy-agent\
    echo         Crea el archivo con las variables de LiveKit y NVIDIA NIM.
    echo.
    pause
    exit /b 1
)

:: Check key env vars
echo Verificando variables de entorno...
python -c "import os; from dotenv import load_dotenv; load_dotenv(); k=os.getenv('OPENAI_API_KEY',''); l=os.getenv('LIVEKIT_URL',''); print(f'  OPENAI_API_KEY: {\"SET (\" + k[:12] + \"...)\" if k else \"NOT SET\"}'); print(f'  LIVEKIT_URL: {l or \"NOT SET\"}'); print(f'  LLM_MODEL: {os.getenv(\"LLM_MODEL\", \"NOT SET\")}')"
echo.

:: Kill any previous agent on port 8081
echo Verificando puerto 8081...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8081 ^| findstr LISTENING') do (
    echo   Matando proceso anterior (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Start agent
echo Iniciando agente Edy...
echo (Presiona Ctrl+C para detener)
echo ============================================
echo.
python agent.py start

:: If we reach here, the agent stopped
echo.
echo ============================================
echo   Agente detenido.
echo ============================================
pause
