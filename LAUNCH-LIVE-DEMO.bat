@echo off
title CONSTRUCT 2026 - 100%% FULL-POWER TRADING212 DUAL-DESK LIVE DEMO ($100 + $100)
cd /d "%~dp0"
echo ================================================================================
echo   CONSTRUCT 2026: 100%% FULL-POWER TRADING212 DUAL-DESK LIVE DEMO ($100 + $100)
echo   Command Center UI: http://127.0.0.1:8800
echo   [Copy-Safe Mode Active: Window will auto-heal and never close unexpectedly]
echo ================================================================================

:RESTART_LOOP
node src/index.js
echo.
echo [Guardian] Engine process interrupted — auto-restarting in 2 seconds (Close window with X to exit)...
timeout /t 2 /nobreak >nul
goto RESTART_LOOP
