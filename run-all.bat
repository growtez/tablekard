@echo off
echo Starting Super Admin...
start "Super Admin" cmd /c npm run dev:super-admin

echo Starting Restaurant Admin...
start "Restaurant Admin" cmd /c npm run dev:restaurant-admin

echo Starting Customer Web...
start "Customer Web" cmd /c npm run dev:customer-web

echo Starting Inhouse Service App...
start "Inhouse Service App" cmd /c npm run dev:inhouse-service-app

echo All applications are starting in separate windows!
pause
