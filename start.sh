#!/bin/bash
export WINEARCH=win64
export WINEPREFIX=/home/steam/.wine64

echo "Starting Conan Exiles server via screen ..."

if ! screen -list | fgrep -q ".conanex"; then
  screen -dmS conanex xvfb-run --auto-servernum --server-args='-screen 0 640x480x24:32' wine /home/steam/games/conanex/ConanSandboxServer.exe -log	
  echo -e "\E[0;32mServer started."
  tput sgr0

  if ! screen -list | fgrep -q ".conanex"; then
    echo -e "\E[0;31mServer couldn't be started.."
    tput sgr0
  fi
else
  echo -e "\E[0;31mServer is already running."
  tput sgr0
fi
