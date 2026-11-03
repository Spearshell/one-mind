@echo off
title Reset Dual Live Demo Portfolios to $100.00 Each
cd /d "%~dp0"
node src/core/reset-portfolios.js
pause
