@echo on
echo Packaging the bot...

pkg . --targets node18-win-x64 --output bot.exe --public

echo Done!
pause