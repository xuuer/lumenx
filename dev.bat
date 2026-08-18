@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    echo [setup] Installing root dependencies...
    npm install
)

npm run dev
