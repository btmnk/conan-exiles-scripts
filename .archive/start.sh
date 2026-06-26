#!/bin/bash

. config

if [ -z "$SCREEN_NAME" ]; then
  echo "SCREEN_NAME config was not set!"
  exit 1
fi

echo "Starting Conan Exiles server via screen ..."

if ! screen -list | fgrep -q ".$SCREEN_NAME"; then
  screen -dmS $SCREEN_NAME ./run-server.sh
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
