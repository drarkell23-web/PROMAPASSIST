\
@echo off
cd /d "%~dp0"
echo Starting DFifty PRO server...
start "" cmd /c "node server.js"
timeout /t 1 >nul
start "" "http://localhost:3000/index.html"
