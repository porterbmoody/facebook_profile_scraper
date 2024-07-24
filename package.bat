@echo on
echo Packaging the bot...

pkg . --targets node18-win-x64 --output bot.exe --public

@REM echo Pushing to GitHub...
@REM git add .
@REM git commit -m "Packaged bot update"
@REM git push

echo Done!
pause