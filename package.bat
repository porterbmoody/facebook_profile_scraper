@echo off
echo Packaging the bot...

pkg . --targets node18-win-x64 --output bot.exe --public

echo Pushing to GitHub...
git add .
git commit -m "Packaged bot update"
git push

echo Done!
pause