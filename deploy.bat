@echo off
title Restro - Git Push and Vercel Deploy
echo ========================================================
echo   Restro ERP - Auto Push to GitHub and Deploy to Vercel
echo ========================================================
echo.
echo [1/3] Staging all changed files...
git add -A

echo [2/3] Committing changes...
git commit -m "Manual sync: %DATE% %TIME%"

echo [3/3] Pushing to GitHub (origin/master)...
git push origin master

echo.
echo ========================================================
echo   DONE! Pushed to https://github.com/calculatorspoint-ops/Restro
echo   Vercel deployment has been automatically triggered!
echo ========================================================
pause
