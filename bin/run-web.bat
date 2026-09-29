@echo off
echo.
echo [INFO] 使用 Vite 命令运行 Web 工程。
echo.
%~d0
cd %~dp0
cd ..
yarn dev
pause