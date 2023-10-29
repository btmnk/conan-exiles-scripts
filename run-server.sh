#!/bin/bash

. config

if [ -z "$SERVER_DIR" ]; then
  echo "SERVER_DIR config was not set!"
  exit 1
fi

if [ -z "$WINE_PREFIX" ]; then
  echo "WINEPREFIX config was not set!"
  exit 1
fi

export WINEARCH=win64
export WINEPREFIX=$WINE_PREFIX

echo "--- Checking if WINE is properly installed"
if [ ! -d ${WINE_PREFIX}/drive_c/windows ]; then
  echo "--- Setting up WINE"
    cd ${SERVER_DIR}
    winecfg > /dev/null 2>&1
    sleep 15
else
  echo "--- WINE properly set up"
fi

app_exe="$SERVER_DIR/ConanSandboxServer.exe"

echo "--- Starting Conan Exiles server ..."
xvfb-run --auto-servernum --server-args='-screen 0 640x480x24:32' wine $app_exe -log