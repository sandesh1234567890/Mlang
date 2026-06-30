@echo off
echo Starting Static MLang Web IDE on local server...
echo Open http://localhost:8080/ in your browser!
python -m http.server 8080 --directory mlang-js
pause
