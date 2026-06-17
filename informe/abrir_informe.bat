@echo off
cd /d "%~dp0informe"
echo Abriendo el informe en http://localhost:8000 ...
start "" http://localhost:8000
python -m http.server 8000
