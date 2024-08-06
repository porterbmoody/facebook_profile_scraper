@echo on
echo Packaging the bot...

pkg . --targets node18-win-x64 --output bot6.3.exe --public

echo Done!
pause