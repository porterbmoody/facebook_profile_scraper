@echo on
echo Packaging the bot...

@REM pkg . --targets node18-win-x64 --output bot.exe --public

echo Pushing to GitHub...
git add .
git commit -m "Packaged bot update"
git push

echo Done!
pause