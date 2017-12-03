@echo off
setlocal

set parent=%~dp0
echo parent=%parent%
for %%a in ("%parent:~0,-1%") do set grandparent=%%~dpa
echo howielib=%grandparent%

set target="%USERPROFILE%\.node_modules\howielib"
echo target=%target%

if not exist "%USERPROFILE%\.node_modules" (
echo Creating "%USERPROFILE%\.node_modules"
mkdir "%USERPROFILE%\.node_modules"
)

if exist "%USERPROFILE%\.node_modules\howielib" (
echo Removing old version of "%USERPROFILE%\.node_modules\howielib"
rmdir "%USERPROFILE%\.node_modules\howielib" /s /q
) 

echo Installing howielib to %target%
mkdir %target%
xcopy "%grandparent:~0,-1%" %target% /s/e/h

echo Installation complete
pause