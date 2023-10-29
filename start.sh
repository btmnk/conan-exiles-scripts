#!/bin/bash

. config

if [ -z "$SCREEN_NAME" ]; then
  echo "SCREEN_NAME config was not set!"
fi

if [ -z "$SERVER_DIR" ]; then
  echo "SERVER_DIR config was not set!"
fi

export WINEARCH=win64
export WINEPREFIX=/home/steam/.wine64

app_exe="$SERVER_DIR/ConanSandboxServer.exe"

echo "Starting Conan Exiles server via screen ..."

if ! screen -list | fgrep -q ".$SCREEN_NAME"; then
  screen -dmS $SCREEN_NAME xvfb-run --auto-servernum --server-args='-screen 0 640x480x24:32' wine $app_exe -log	
  echo -e "\E[0;32mServer started."
  tput sgr0

  if ! screen -list | fgrep -q ".$SCREEN_NAME"; then
    echo -e "\E[0;31mServer couldn't be started.."
    tput sgr0
    exit 1
  fi
else
  echo -e "\E[0;31mServer is already running."
  tput sgr0
fi

exit 0
