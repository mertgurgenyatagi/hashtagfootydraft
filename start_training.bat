@echo off
cd /d "%~dp0"

start "footydraft bot training" cmd /k python -u -m bot_ai.train
start "footydraft dashboard" cmd /k python -u -m dashboard.app
