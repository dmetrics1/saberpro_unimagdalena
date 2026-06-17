#!/bin/bash
cd "$(dirname "$0")/informe"
echo "Abriendo el informe en http://localhost:8000 ..."
python3 -m http.server 8000 >/dev/null 2>&1 &
sleep 1
( command -v xdg-open >/dev/null && xdg-open http://localhost:8000 ) || \
( command -v open >/dev/null && open http://localhost:8000 ) || \
echo "Abre manualmente: http://localhost:8000"
echo "Para detener el servidor: pkill -f http.server"
wait
