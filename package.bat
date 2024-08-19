@echo on
echo Packaging the bot...

pkg . --targets node18-win-x64 --output bot6.4_test.exe --public

echo Done!
pause