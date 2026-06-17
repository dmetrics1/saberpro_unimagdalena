@echo off
chcp 65001 > nul
set PYTHONUTF8=1

echo =======================================================
echo    INFORME SABER PRO - UNIMAGDALENA
echo    Regeneracion de datos e informe HTML
echo =======================================================
echo.

IF NOT EXIST "venv\Scripts\activate.bat" (
    echo Creando entorno virtual venv...
    python -m venv venv
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Instalando o actualizando dependencias...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo =======================================================
echo    1/3 Construyendo cuadrantes de valor agregado
echo =======================================================
python scripts\01_construir_cuadrantes.py
IF ERRORLEVEL 1 GOTO error

echo.
echo =======================================================
echo    2/3 Construyendo indicadores agregados Saber Pro
echo =======================================================
python scripts\02_construir_agregados.py
IF ERRORLEVEL 1 GOTO error

echo.
echo =======================================================
echo    3/3 Consolidando JSON maestro
echo =======================================================
python scripts\03_consolidar_json.py
IF ERRORLEVEL 1 GOTO error

echo.
echo Copiando JSON maestro al informe HTML...
copy /Y data\processed\datos_informe.json informe\informe\data\datos_informe.json > nul
IF ERRORLEVEL 1 GOTO error

echo.
echo =======================================================
echo    PROCESO COMPLETADO
echo =======================================================
echo JSON maestro:
echo   data\processed\datos_informe.json
echo Informe HTML:
echo   informe\informe\index.html
echo.
echo Para abrirlo, ejecuta:
echo   informe\abrir_informe.bat
echo.
pause
exit /b 0

:error
echo.
echo =======================================================
echo    ERROR EN LA EJECUCION
echo =======================================================
echo Revisa el mensaje anterior. El proceso se detuvo para evitar entregar datos incompletos.
echo.
pause
exit /b 1
