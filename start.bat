@echo off
chcp 65001 >nul
title МегаМаркет — запуск
echo ============================================
echo    МегаМаркет — единый запуск
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] Устанавливаем зависимости backend...
cd backend
if not exist node_modules (
    call npm install --no-audit --no-fund >nul 2>&1
)
cd ..

echo [2/5] Устанавливаем зависимости frontend...
cd frontend
if not exist node_modules (
    call npm install --legacy-peer-deps --no-audit --no-fund >nul 2>&1
)
cd ..

echo [3/5] Собираем backend...
cd backend
if not exist dist\main.js (
    call npx nest build >nul 2>&1
)
cd ..

echo [4/5] Инициализируем базу данных (SQLite)...
cd backend
if not exist prisma\dev.db (
    call npx prisma migrate dev --name init --skip-generate >nul 2>&1
)
call npx prisma db seed >nul 2>&1
cd ..

echo [5/5] Запускаем сервисы...
echo.

start "MegaMarket API :3001" cmd /k "cd /d %~dp0backend && node dist\main.js"
start "MegaMarket Frontend :3000" cmd /k "cd /d %~dp0frontend && set NEXT_PUBLIC_API_URL=http://localhost:3001 && npx next dev -p 3000"

echo.
echo ============================================
echo    Сайт:       http://localhost:3000
echo    API:        http://localhost:3001/api/ads
echo    Демо-вход:  demo@megamarket.ru / demo1234
echo    Подождите ~10 секунд, затем откройте браузер.
echo ============================================
echo.
pause
